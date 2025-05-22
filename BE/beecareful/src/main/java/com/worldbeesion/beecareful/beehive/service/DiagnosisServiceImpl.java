package com.worldbeesion.beecareful.beehive.service;

import static com.worldbeesion.beecareful.common.util.S3Util.*;

import com.worldbeesion.beecareful.beehive.constant.BeeStage;
import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;
import com.worldbeesion.beecareful.beehive.constant.DiseaseName;
import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.beehive.model.entity.*;
import com.worldbeesion.beecareful.beehive.repository.*;
import com.worldbeesion.beecareful.member.exception.BadRequestException;
import com.worldbeesion.beecareful.member.model.Member;
import com.worldbeesion.beecareful.notification.constant.NotificationType;
import com.worldbeesion.beecareful.notification.model.dto.NotificationRequestDto;
import com.worldbeesion.beecareful.notification.service.FCMService;
import com.worldbeesion.beecareful.s3.constant.S3FileStatus;
import com.worldbeesion.beecareful.s3.model.dto.GeneratePutUrlResponse;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.repository.S3FileMetadataRepository;
import com.worldbeesion.beecareful.s3.service.S3PresignService;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class DiagnosisServiceImpl implements DiagnosisService {

    private final String aiDiagnosisPath;

    private final WebClient webClient;

    private final FCMService fcmService;
    private final S3PresignService s3PresignService;
    private final DiagnosisFinalizerService diagnosisFinalizerService;

    private final S3FileMetadataRepository s3FileMetadataRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final OriginalPhotoRepository originalPhotoRepository;
    private final AnalyzedPhotoRepository analyzedPhotoRepository;
    private final AnalyzedPhotoDiseaseRepository analyzedPhotoDiseaseRepository;
    private final DiseaseRepository diseaseRepository;
    private final BeehiveRepository beehiveRepository;

    public DiagnosisServiceImpl(
        @Value("${ai-server.diagnosis-path}") String aiDiagnosisPath,
        @Value("${ai-server.baseUrl}") String aiServerBaseUrl,
        FCMService fcmService, S3PresignService s3PresignService, DiagnosisFinalizerService diagnosisFinalizerService,
        S3FileMetadataRepository s3FileMetadataRepository, DiagnosisRepository diagnosisRepository, OriginalPhotoRepository originalPhotoRepository,
        AnalyzedPhotoRepository analyzedPhotoRepository, AnalyzedPhotoDiseaseRepository analyzedPhotoDiseaseRepository,
        DiseaseRepository diseaseRepository, BeehiveRepository beehiveRepository) {
        this.aiDiagnosisPath = aiDiagnosisPath;
        this.webClient = WebClient.builder()
            .baseUrl(aiServerBaseUrl)
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(128 * 1024 * 1024)) // 128MB buffer
            .build();
        this.fcmService = fcmService;
        this.s3PresignService = s3PresignService;
        this.diagnosisFinalizerService = diagnosisFinalizerService;
        this.s3FileMetadataRepository = s3FileMetadataRepository;
        this.diagnosisRepository = diagnosisRepository;
        this.originalPhotoRepository = originalPhotoRepository;
        this.analyzedPhotoRepository = analyzedPhotoRepository;
        this.analyzedPhotoDiseaseRepository = analyzedPhotoDiseaseRepository;
        this.diseaseRepository = diseaseRepository;
        this.beehiveRepository = beehiveRepository;
    }

    @Override
    public Mono<DiagnosisApiResponse> analyzePhoto(String originalPhotoS3Key) {
        log.debug("Sending S3 key {} to AI API for analysis.", originalPhotoS3Key);

        return webClient.post()
            .uri(aiDiagnosisPath)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Map.of("s3Key", originalPhotoS3Key))
            .accept(MediaType.APPLICATION_JSON)
            .retrieve()
            .bodyToMono(DiagnosisApiResponse.class)
            .flatMap(response -> {
                if (response == null) {
                    log.error("AI API returned null response");
                    return Mono.error(new RuntimeException("AI API returned null response"));
                }

                if (response.diagnosis() == null) {
                    log.error("AI API returned null diagnosis result");
                    return Mono.error(new RuntimeException("AI API returned null diagnosis result"));
                }

                if (response.annotatedImageS3Key() == null || response.annotatedImageS3Key().isEmpty()) {
                    log.error("AI API returned null or empty analyzed image S3 key");
                    return Mono.error(new RuntimeException("AI API returned null or empty analyzed image S3 key"));
                }

                log.debug("Received diagnosis result and analyzed image S3 key: {}", response.annotatedImageS3Key());
                return Mono.just(response);
            })
            .onErrorResume(e -> {
                log.error("Error occurred while calling AI API: {}", e.getMessage(), e);
                return Mono.error(new RuntimeException("Failed to get diagnosis from AI API", e));
            });
    }

    @Override
    public void runDiagnosis(Long diagnosisId) {
        log.info("Starting diagnosis process for diagnosisId: {}", diagnosisId);

        // 1. Retrieve Diagnosis entity
        Diagnosis diagnosis = diagnosisRepository.findById(diagnosisId)
            .orElseThrow(() -> {
                log.error("Diagnosis not found for ID: {}", diagnosisId);
                return new BadRequestException();
            });

        // 2. Retrieve all OriginalPhoto entities associated with this Diagnosis
        List<OriginalPhoto> originalPhotos = originalPhotoRepository.findAllByDiagnosis(diagnosis);

        if (originalPhotos.isEmpty()) {
            log.warn("No original photos found for diagnosisId: {}. Diagnosis process cannot run.", diagnosisId);
            return;
        }
        log.info("Found {} original photos for diagnosisId: {}", originalPhotos.size(), diagnosisId);

        // 3. Process each photo asynchronously and collect the responses
        List<CompletableFuture<Void>> futures = originalPhotos.stream()
            .map(originalPhoto ->
                CompletableFuture.runAsync(() -> analyzePhoto(originalPhoto, diagnosis))
            )
            .toList();

        // 4. Wait for all asynchronous tasks to complete and collect results
        try {
            CompletableFuture.allOf(futures.toArray(CompletableFuture[]::new)).join();
            log.info("All photo processing tasks completed for diagnosisId: {}", diagnosisId);
        } catch (Exception e) {
            // This catch block might capture CompletionException if any future failed unexpectedly *during join*
            log.error("Error occurred while waiting for all photo processing tasks for diagnosisId: {}", diagnosisId, e);
            throw e;
        }

        log.info("Finished diagnosis process for diagnosisId: {}", diagnosisId);

        // Call finishDiagnosis through the proxy
        diagnosisFinalizerService.finishDiagnosis(diagnosisId);
    }

    /**
     * Asynchronously processes a single original photo:
     * - Updates its status to ANALYZING.
     * - Calls the AiDiagnosisService to get analysis data from the external AI API.
     * - Uploads the analyzed image (from AI data) to S3.
     * - Saves the analysis results (AnalyzedPhoto, AnalyzedPhotoDisease) to the database.
     * - Updates the original photo's status to SUCCESS or FAIL.
     */
    private void analyzePhoto(OriginalPhoto originalPhoto, Diagnosis diagnosis) {
        String originalS3Key = originalPhoto.getS3FileMetadata().getS3Key();
        Long photoId = originalPhoto.getId();
        log.info("[DiagnosisId: {}, PhotoId: {}] Starting processing.", diagnosis.getId(), photoId);

        try {
            // Note: This database update runs within this async task's transaction (if any).
            originalPhoto.updateStatus(DiagnosisStatus.ANALYZING);
            originalPhotoRepository.save(originalPhoto); // Explicitly save status update
            log.debug("[DiagnosisId: {}, PhotoId: {}] Status set to ANALYZING.", diagnosis.getId(), photoId);

            // Timeout is important to prevent indefinite blocking.
            DiagnosisApiResponse diagnosisApiResponse = analyzePhoto(originalS3Key)
                .block(Duration.ofSeconds(120)); // Increased timeout for AI call + parsing

            if (diagnosisApiResponse == null) {
                log.error("[DiagnosisId: {}, PhotoId: {}] AI analysis returned no data.", diagnosis.getId(), photoId);
                throw new IllegalStateException("AI analysis returned null data.");
            }

            DiagnosisApiResponse.DiagnosisResult diagResult = diagnosisApiResponse.diagnosis();
            String analyzedImageS3Key = diagnosisApiResponse.annotatedImageS3Key();

            if (diagResult == null) {
                log.error("[DiagnosisId: {}, PhotoId: {}] DiagnosisResult from AI analysis is null.", diagnosis.getId(), photoId);
                throw new IllegalStateException("AI analysis returned null DiagnosisResult.");
            }
            if (analyzedImageS3Key == null || analyzedImageS3Key.isEmpty()) {
                log.error("[DiagnosisId: {}, PhotoId: {}] Analyzed image S3 key from AI analysis is null or empty.", diagnosis.getId(), photoId);
                throw new IllegalStateException("AI analysis returned null or empty analyzed image S3 key.");
            }
            log.debug("[DiagnosisId: {}, PhotoId: {}] Received AI analysis data with analyzed image S3 key: {}",
                diagnosis.getId(), photoId, analyzedImageS3Key);

            // Get S3 metadata for the analyzed image using the S3 key returned from the AI service
            S3FileMetadata analyzedImageMetadata = s3FileMetadataRepository.findByS3Key(analyzedImageS3Key);
            if (analyzedImageMetadata == null) {
                log.info("[DiagnosisId: {}, PhotoId: {}] Creating new S3FileMetadata for S3 key: {}",
                    diagnosis.getId(), photoId, analyzedImageS3Key);

                // Create a new S3FileMetadata entry
                analyzedImageMetadata = S3FileMetadata.builder()
                    .originalFilename(extractFilenameFromS3Key(analyzedImageS3Key))
                    .s3Key(analyzedImageS3Key)
                    .url(null) // URL will be generated when needed
                    .contentType("image/jpeg") // Set the content type to image/jpeg as required
                    .status(S3FileStatus.STORED) // Mark as STORED (completed)
                    .build();

                analyzedImageMetadata = s3FileMetadataRepository.save(analyzedImageMetadata);
                log.info("[DiagnosisId: {}, PhotoId: {}] Created new S3FileMetadata with ID: {} for S3 key: {}",
                    diagnosis.getId(), photoId, analyzedImageMetadata.getId(), analyzedImageS3Key);
            }
            else {
                // Update existing metadata if needed
                analyzedImageMetadata.setStatus(S3FileStatus.STORED);
                analyzedImageMetadata = s3FileMetadataRepository.save(analyzedImageMetadata);
                log.info("[DiagnosisId: {}, PhotoId: {}] Updated existing S3FileMetadata with ID: {} for S3 key: {}",
                    diagnosis.getId(), photoId, analyzedImageMetadata.getId(), analyzedImageS3Key);
            }
            log.info("[DiagnosisId: {}, PhotoId: {}] Retrieved metadata for analyzed image with S3 Key: {}",
                diagnosis.getId(), photoId, analyzedImageMetadata.getS3Key());

            // Create and save AnalyzedPhoto entity
            AnalyzedPhoto analyzedPhoto = createAnalyzedPhotoEntity(originalPhoto, diagnosis, analyzedImageMetadata, diagResult);
            analyzedPhotoRepository.save(analyzedPhoto);
            log.info("[DiagnosisId: {}, PhotoId: {}] Saved AnalyzedPhoto entity: {}",
                diagnosis.getId(), photoId, analyzedPhoto);

            // Save associated disease details
            saveAnalyzedPhotoDiseases(analyzedPhoto, diagResult);
            log.info("[DiagnosisId: {}, PhotoId: {}] Saved AnalyzedPhotoDisease entities.", diagnosis.getId(), photoId);

            // Update original photo status to SUCCESS
            originalPhoto.updateStatus(DiagnosisStatus.SUCCESS);
            originalPhotoRepository.save(originalPhoto); // Explicitly save status update
            log.info("[DiagnosisId: {}, PhotoId: {}] Successfully processed.", diagnosis.getId(), photoId);

        } catch (Exception e) {
            log.error("[DiagnosisId: {}, PhotoId: {}] FAILED to process diagnosis.", diagnosis.getId(), photoId, e);
            // Attempt to update status to FAIL
            try {
                originalPhoto.updateStatus(DiagnosisStatus.FAIL);
                originalPhotoRepository.save(originalPhoto); // Explicitly save status update
            } catch (Exception dbEx) {
                log.error("[DiagnosisId: {}, PhotoId: {}] CRITICAL: Failed to update originalPhoto status to FAIL after processing error.",
                    diagnosis.getId(), photoId, dbEx);
            }
            // Allow the CompletableFuture to complete exceptionally.
            // This exception will be caught by the .join() in the main runDiagnosis method if it's a direct cause of failure.
            throw new RuntimeException("Failed processing photoId " + photoId + " for diagnosisId " + diagnosis.getId(), e);
        }
    }

    @Override
    public AnalyzedPhoto createAnalyzedPhotoEntity(
        OriginalPhoto originalPhoto,
        Diagnosis diagnosis,
        S3FileMetadata analyzedImageMetadata,
        DiagnosisApiResponse.DiagnosisResult diagResult
    ) {
        long totalImagoCount = Optional.ofNullable(diagResult.imago().normalCount()).orElse(0L)
            + Optional.ofNullable(diagResult.imago().varroaCount()).orElse(0L)
            + Optional.ofNullable(diagResult.imago().dwvCount()).orElse(0L);

        long totalLarvaCount = Optional.ofNullable(diagResult.larva().normalCount()).orElse(0L)
            + Optional.ofNullable(diagResult.larva().varroaCount()).orElse(0L)
            + Optional.ofNullable(diagResult.larva().foulBroodCount()).orElse(0L)
            + Optional.ofNullable(diagResult.larva().chalkBroodCount()).orElse(0L);

        return AnalyzedPhoto.builder()
            .originalPhoto(originalPhoto)
            .diagnosis(diagnosis)
            .s3FileMetadata(analyzedImageMetadata)
            .imagoCount(totalImagoCount)
            .larvaCount(totalLarvaCount)
            .build();
    }

    @Override
    public void saveAnalyzedPhotoDiseases(AnalyzedPhoto analyzedPhoto, DiagnosisApiResponse.DiagnosisResult result) {
        // Larva diseases
        saveAnalyzedPhotoDisease(analyzedPhoto, BeeStage.LARVA, DiseaseName.VARROA, result.larva().varroaCount());
        saveAnalyzedPhotoDisease(analyzedPhoto, BeeStage.LARVA, DiseaseName.FOULBROOD, result.larva().foulBroodCount());
        saveAnalyzedPhotoDisease(analyzedPhoto, BeeStage.LARVA, DiseaseName.CHALKBROOD, result.larva().chalkBroodCount());

        // Imago diseases
        saveAnalyzedPhotoDisease(analyzedPhoto, BeeStage.IMAGO, DiseaseName.VARROA, result.imago().varroaCount());
        saveAnalyzedPhotoDisease(analyzedPhoto, BeeStage.IMAGO, DiseaseName.DWV, result.imago().dwvCount());
    }

    @Override
    public void saveAnalyzedPhotoDisease(AnalyzedPhoto analyzedPhoto, BeeStage beeStage, DiseaseName diseaseName, Long count) {
        if (count != null && count >= 0) {
            if (analyzedPhoto != null) {
                Disease disease = diseaseRepository.findByNameAndStage(diseaseName, beeStage);

                AnalyzedPhotoDisease diseaseRecord = AnalyzedPhotoDisease.builder()
                    .analyzedPhoto(analyzedPhoto)
                    .disease(disease)
                    .count(count)
                    .build();
                analyzedPhotoDiseaseRepository.save(diseaseRecord);
            }
            else {
                // Log the summed up disease details without saving them to the database
                log.info("Summed up disease details: {} {} count: {}", beeStage, diseaseName, count);
            }
        }
    }

    @Override
    public DiagnosisApiResponse.DiagnosisResult sumUpDiagnosisResults(List<DiagnosisApiResponse.DiagnosisResult> diagnosisResults) {
        // Create a summed up DiagnosisResult
        long larvaVarroaCount = 0L;
        long larvaFoulBroodCount = 0L;
        long larvaChalkBroodCount = 0L;
        long larvaNormalCount = 0L;
        long imagoVarroaCount = 0L;
        long imagoDwvCount = 0L;
        long imagoNormalCount = 0L;

        for (DiagnosisApiResponse.DiagnosisResult diagnosisResult : diagnosisResults) {
            if (diagnosisResult != null) {
                // Sum up larva counts
                if (diagnosisResult.larva() != null) {
                    larvaVarroaCount += Optional.ofNullable(diagnosisResult.larva().varroaCount()).orElse(0L);
                    larvaFoulBroodCount += Optional.ofNullable(diagnosisResult.larva().foulBroodCount()).orElse(0L);
                    larvaChalkBroodCount += Optional.ofNullable(diagnosisResult.larva().chalkBroodCount()).orElse(0L);
                    larvaNormalCount += Optional.ofNullable(diagnosisResult.larva().normalCount()).orElse(0L);
                }

                // Sum up imago counts
                if (diagnosisResult.imago() != null) {
                    imagoVarroaCount += Optional.ofNullable(diagnosisResult.imago().varroaCount()).orElse(0L);
                    imagoDwvCount += Optional.ofNullable(diagnosisResult.imago().dwvCount()).orElse(0L);
                    imagoNormalCount += Optional.ofNullable(diagnosisResult.imago().normalCount()).orElse(0L);
                }
            }
        }

        // Create summed up result
        DiagnosisApiResponse.LarvaResult summedLarvaResult = DiagnosisApiResponse.LarvaResult.builder()
            .varroaCount(larvaVarroaCount)
            .foulBroodCount(larvaFoulBroodCount)
            .chalkBroodCount(larvaChalkBroodCount)
            .normalCount(larvaNormalCount)
            .build();

        DiagnosisApiResponse.ImagoResult summedImagoResult = DiagnosisApiResponse.ImagoResult.builder()
            .varroaCount(imagoVarroaCount)
            .dwvCount(imagoDwvCount)
            .normalCount(imagoNormalCount)
            .build();

        return DiagnosisApiResponse.DiagnosisResult.builder()
            .larva(summedLarvaResult)
            .imago(summedImagoResult)
            .build();
    }

    @Override
    public Map<Long, Long> getStatusesOfDiagnoses(List<Long> diagnosisIds) {
        List<OriginalPhotoStatusDto> statusList = originalPhotoRepository.findStatusesByDiagnosisIds(diagnosisIds);
        Map<Long, List<DiagnosisStatus>> group = new HashMap<>();

        for (OriginalPhotoStatusDto originalPhotoStatusDto : statusList) {
            group.computeIfAbsent(originalPhotoStatusDto.diagnosisId(), k -> new ArrayList<>()).add(originalPhotoStatusDto.status());
        }

        return calculateStatus(group);
    }

    @Override
    public Map<Long, Long> calculateStatus(Map<Long, List<DiagnosisStatus>> group) {
        Map<Long, Long> result = new HashMap<>();
        for (Map.Entry<Long, List<DiagnosisStatus>> entry : group.entrySet()) {
            List<DiagnosisStatus> diagnosisStatuses = entry.getValue();
            if (diagnosisStatuses.contains(DiagnosisStatus.FAIL) || diagnosisStatuses.contains(DiagnosisStatus.UNRECIEVED)) {
                result.put(entry.getKey(), 2L);
            }
            else if (diagnosisStatuses.contains(DiagnosisStatus.WAITING) || diagnosisStatuses.contains(DiagnosisStatus.ANALYZING)) {
                result.put(entry.getKey(), 0L);
            }
            else {
                result.put(entry.getKey(), 1L);
            }
        }
        return result;
    }

    @Override
    @Transactional
    public List<DiagnosisResponseDto> generateDiagnosisPresignedUrls(DiagnosisDto dto) {
        //TODO 파일 메타데이터 처리, s3Presigned 제약조건

        Long beeHiveId = dto.beeHiveId();
        Beehive findBeeHive = beehiveRepository.findById(beeHiveId).orElseThrow();
        // TODO
        // 1. 벌통 존재유무 확인
        // 2. 벌통 소유자 확인

        Diagnosis diagnosis = Diagnosis.builder()
            .beehive(findBeeHive)
            .build();

        diagnosisRepository.save(diagnosis);

        List<Photo> photoMetadataList = dto.photos();
        List<DiagnosisResponseDto> response = new ArrayList<>();

        for (Photo photoMetadata : photoMetadataList) {
            GeneratePutUrlResponse putUrlDto = s3PresignService.generatePutOriginPhotoUrl(
                photoMetadata.filename(),
                photoMetadata.contentType(),
                photoMetadata.expectedSize()
            );
            S3FileMetadata s3FileMetadata = putUrlDto.s3FileMetadata();
            String putUrl = putUrlDto.preSignedUrl();

            OriginalPhoto originalPhoto = OriginalPhoto.builder()
                .diagnosis(diagnosis)
                .s3FileMetadata(s3FileMetadata)
                .status(DiagnosisStatus.WAITING)
                .build();

            originalPhotoRepository.save(originalPhoto);

            int status = 0;
            if (null == putUrl || putUrl.isEmpty()) {
                status = 1;
            }

            DiagnosisResponseDto build = DiagnosisResponseDto.builder()
                .filename(photoMetadata.filename())
                .status(status)
                .preSignedUrl(putUrl)
                .build();
            response.add(build);
        }

        return response;
    }

    private double calculateDiseaseRatio(Long diseaseCount, Long totalCount) {
        if (totalCount == null || totalCount == 0)
            return 0;
        return (double)diseaseCount / totalCount * 100;
    }
}
