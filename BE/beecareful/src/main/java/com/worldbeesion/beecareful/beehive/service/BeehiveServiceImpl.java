package com.worldbeesion.beecareful.beehive.service;

import static com.worldbeesion.beecareful.common.util.HttpUtil.*;
import static com.worldbeesion.beecareful.common.util.S3Util.*;

import com.worldbeesion.beecareful.beehive.constant.BeeStage;
import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;
import com.worldbeesion.beecareful.beehive.constant.DiseaseName;
import com.worldbeesion.beecareful.beehive.exception.BeehiveNotFoundException;
import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.beehive.model.entity.*;
import com.worldbeesion.beecareful.beehive.repository.*;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.member.exception.BadRequestException;
import com.worldbeesion.beecareful.member.exception.MemberNotFoundException;
import com.worldbeesion.beecareful.member.model.Members;
import com.worldbeesion.beecareful.member.repository.MembersRepository;
import com.worldbeesion.beecareful.s3.constant.FilePathPrefix;

import com.worldbeesion.beecareful.s3.model.dto.GeneratePutUrlResponse;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.service.S3FileService;
import com.worldbeesion.beecareful.s3.service.S3PresignService;

import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

import java.time.Duration; // For timeout on block()
import java.util.*;
import java.util.concurrent.CompletableFuture;

import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisApiResponse;

@Service
@RequiredArgsConstructor // Lombok constructor injection
@Slf4j
public class BeehiveServiceImpl implements BeehiveService {

    private final S3PresignService s3PresignService;
    private final S3FileService s3FileService;

    private final BeehiveRepository beehiveRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final OriginalPhotoRepository originalPhotoRepository;
    private final ApiaryRepository apiaryRepository;
    private final MembersRepository membersRepository;
    private final AnalyzedPhotoRepository analyzedPhotoRepository;
    private final AnalyzedPhotoDiseaseRepository analyzedPhotoDiseaseRepository;
    private final TurretRepository turretRepository;
    private final DiseaseRepository diseaseRepository;

    @Resource(lookup = "diagnosisWebClient")
    private final WebClient webClient;

    @Override
    @Transactional
    public void addBeehive(BeehiveRequestDto beehiveRequestDto, UserDetailsImpl userDetails) {
        String nickname = beehiveRequestDto.nickname();
        Long xDirection = beehiveRequestDto.xDirection();
        Long yDirection = beehiveRequestDto.yDirection();

        Long memberId = userDetails.getMemberId();
        Members members = membersRepository.findById(memberId)
            .orElseThrow(MemberNotFoundException::new);

        Apiary apiary = apiaryRepository.findByMembers(members);

        Beehive beehive = Beehive.builder()
            .apiary(apiary)
            .nickname(nickname)
            .xDirection(xDirection)
            .yDirection(yDirection)
            .isInfected(false)
            .build();

        beehiveRepository.save(beehive);
        log.info("Added new beehive '{}' with ID: {} for member ID: {}", nickname, beehive.getId(), memberId);
    }

    @Override
    @Transactional
    public void runDiagnosis(Long diagnosisId) {
        log.info("Starting diagnosis process for diagnosisId: {}", diagnosisId);

        Diagnosis diagnosis = diagnosisRepository.findById(diagnosisId)
            .orElseThrow(() -> {
                log.error("Diagnosis not found for ID: {}", diagnosisId);
                return new BadRequestException(); // TODO: add specific exception or message
            });

        List<OriginalPhoto> originalPhotos = originalPhotoRepository.findAllByDiagnosisId(diagnosisId);

        if (originalPhotos.isEmpty()) {
            log.warn("No original photos found for diagnosisId: {}. Diagnosis process cannot run.", diagnosisId);
            return;
        }
        log.info("Found {} original photos for diagnosisId: {}", originalPhotos.size(), diagnosisId);

        List<CompletableFuture<Void>> futures = originalPhotos.stream()
            .map(originalPhoto -> processSinglePhotoAnalysis(originalPhoto, diagnosis))
            .toList();

        try {
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
            log.info("All photo processing tasks completed for diagnosisId: {}", diagnosisId);
        } catch (Exception e) {
            log.error("Error occurred while waiting for photo processing tasks for diagnosisId: {}", diagnosisId, e);
        }

        log.info("Finished diagnosis process for diagnosisId: {}", diagnosisId);
    }

    private CompletableFuture<Void> processSinglePhotoAnalysis(OriginalPhoto originalPhoto, Diagnosis diagnosis) {
        return CompletableFuture.supplyAsync(() -> {
            String originalPhotoS3Url = originalPhoto.getS3FileMetadata().getUrl();
            String originalS3Key = originalPhoto.getS3FileMetadata().getS3Key();
            Long photoId = originalPhoto.getId();
            log.info("[DiagnosisId: {}, PhotoId: {}] Starting processing.", diagnosis.getId(), photoId);

            try {
                originalPhoto.updateStatus(DiagnosisStatus.ANALYZING);
                log.debug("[DiagnosisId: {}, PhotoId: {}] Status set to ANALYZING.", diagnosis.getId(), photoId);

                log.debug("[DiagnosisId: {}, PhotoId: {}] Sending URL {} to AI API.", diagnosis.getId(), photoId, originalPhotoS3Url);
                Mono<Map<String, Part>> multipartResponseMono = webClient.post()
                    .uri("http://your-ai-api-endpoint") // *** Replace with actual AI API endpoint ***
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("s3Url", originalPhotoS3Url))
                    .accept(MediaType.MULTIPART_FORM_DATA)
                    .exchangeToMono(this::handleAiApiResponse);

                Map<String, Part> responseParts = multipartResponseMono.block(Duration.ofSeconds(120));

                if (responseParts == null || !responseParts.containsKey("diagnosis") || !responseParts.containsKey("image")) {
                    log.error("[DiagnosisId: {}, PhotoId: {}] Incomplete multipart response. Parts: {}",
                        diagnosis.getId(), photoId, responseParts != null ? responseParts.keySet() : "null");
                    throw new IllegalStateException("Incomplete response from AI API");
                }
                log.debug("[DiagnosisId: {}, PhotoId: {}] Received multipart response.", diagnosis.getId(), photoId);

                Part diagnosisJsonPart = responseParts.get("diagnosis");
                Part analyzedImagePart = responseParts.get("image");

                DiagnosisApiResponse.DiagnosisResult diagResult = parseDiagnosisResult(diagnosisJsonPart)
                    .block(Duration.ofSeconds(10));
                if (diagResult == null) {
                    throw new IllegalStateException("Failed to parse diagnosis JSON part");
                }
                log.debug("[DiagnosisId: {}, PhotoId: {}] Parsed diagnosis JSON.", diagnosis.getId(), photoId);

                String imageContentType = getPartContentType(analyzedImagePart);
                String analyzedFilename = "analyzed_" + extractFilenameFromS3Key(originalS3Key);

                byte[] analyzedImageData = DataBufferUtils.join(analyzedImagePart.content())
                    .map(dataBuffer -> {
                        byte[] bytes = new byte[dataBuffer.readableByteCount()];
                        dataBuffer.read(bytes);
                        DataBufferUtils.release(dataBuffer);
                        return bytes;
                    })
                    .block(Duration.ofSeconds(60));

                if (analyzedImageData == null || analyzedImageData.length == 0) {
                    throw new IllegalStateException("Extracted image data is null or empty");
                }
                log.debug("[DiagnosisId: {}, PhotoId: {}] Extracted image bytes ({} bytes).", diagnosis.getId(), photoId,
                    analyzedImageData.length);

                S3FileMetadata analyzedImageMetadata = s3FileService.putObject(
                    analyzedImageData,
                    analyzedFilename,
                    imageContentType,
                    FilePathPrefix.BEEHIVE_DIAGNOSIS
                );
                log.info("[DiagnosisId: {}, PhotoId: {}] Uploaded analyzed image. Key: {}",
                    diagnosis.getId(), photoId, analyzedImageMetadata.getS3Key());

                AnalyzedPhoto analyzedPhoto = createAnalyzedPhotoEntity(originalPhoto, diagnosis, analyzedImageMetadata, diagResult);
                analyzedPhotoRepository.save(analyzedPhoto);
                log.debug("[DiagnosisId: {}, PhotoId: {}] Saved AnalyzedPhoto ID: {}",
                    diagnosis.getId(), photoId, analyzedPhoto.getId());

                saveAnalyzedDiseases(analyzedPhoto, diagResult);
                log.debug("[DiagnosisId: {}, PhotoId: {}] Saved AnalyzedPhotoDisease entities.", diagnosis.getId(), photoId);

                originalPhoto.updateStatus(DiagnosisStatus.SUCCESS);
                log.info("[DiagnosisId: {}, PhotoId: {}] Successfully processed.", diagnosis.getId(), photoId);

                return null;

            } catch (Exception e) {
                log.error("[DiagnosisId: {}, PhotoId: {}] FAILED to process diagnosis.", diagnosis.getId(), photoId, e);
                try {
                    originalPhoto.updateStatus(DiagnosisStatus.FAIL);
                } catch (Exception dbEx) {
                    log.error("[DiagnosisId: {}, PhotoId: {}] CRITICAL: Failed to update status to FAIL.",
                        diagnosis.getId(), photoId, dbEx);
                }
                throw new RuntimeException("Failed processing photoId " + photoId, e);
            }
        });
    }

    private Mono<Map<String, Part>> handleAiApiResponse(ClientResponse response) {
        if (response.statusCode().isError()) {
            log.error("AI API returned error status: {}", response.statusCode());
            return response.bodyToMono(String.class)
                .flatMap(errorBody -> Mono.error(new RuntimeException("AI API Error: " + response.statusCode() + " - " + errorBody)));
        }
        MediaType contentTypeHeader = response.headers().contentType().orElse(MediaType.APPLICATION_OCTET_STREAM);
        if (!contentTypeHeader.isCompatibleWith(MediaType.MULTIPART_FORM_DATA)) {
            log.error("Unexpected Content-Type from AI API: {}", contentTypeHeader);
            return Mono.error(new RuntimeException("Expected multipart/form-data response, but received: " + contentTypeHeader));
        }
        return response.bodyToFlux(Part.class)
            .collectMap(Part::name);
    }

    private Mono<DiagnosisApiResponse.DiagnosisResult> parseDiagnosisResult(Part jsonPart) {
        return DataBufferUtils.join(jsonPart.content())
            .map(dataBuffer -> {
                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(bytes);
                DataBufferUtils.release(dataBuffer);
                return bytes;
            })
            .flatMap(jsonBytes -> {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    DiagnosisApiResponse tempResponse = objectMapper.readValue(jsonBytes, DiagnosisApiResponse.class);
                    if (tempResponse == null || tempResponse.getDiagnosis() == null) {
                        log.error("Parsed DiagnosisApiResponse or its DiagnosisResult is null. JSON: {}", new String(jsonBytes));
                        return Mono.error(new IllegalStateException("Parsed diagnosis result is null"));
                    }
                    return Mono.just(tempResponse.getDiagnosis());
                } catch (Exception e) {
                    log.error("Failed to decode JSON diagnosis part. JSON: {}", new String(jsonBytes), e);
                    return Mono.error(new RuntimeException("Failed to decode JSON diagnosis part", e));
                }
            });
    }

    private AnalyzedPhoto createAnalyzedPhotoEntity(
        OriginalPhoto originalPhoto,
        Diagnosis diagnosis,
        S3FileMetadata analyzedImageMetadata,
        DiagnosisApiResponse.DiagnosisResult diagResult
    ) {
        long totalImagoCount = Optional.ofNullable(diagResult.getImago().getNormalCount()).orElse(0L)
            + Optional.ofNullable(diagResult.getImago().getVarroaCount()).orElse(0L)
            + Optional.ofNullable(diagResult.getImago().getDwvCount()).orElse(0L);

        long totalLarvaCount = Optional.ofNullable(diagResult.getLarva().getNormalCount()).orElse(0L)
            + Optional.ofNullable(diagResult.getLarva().getVarroaCount()).orElse(0L)
            + Optional.ofNullable(diagResult.getLarva().getFoulBroodCount()).orElse(0L)
            + Optional.ofNullable(diagResult.getLarva().getChalkBroodCount()).orElse(0L);

        return AnalyzedPhoto.builder()
            .originalPhoto(originalPhoto)
            .diagnosis(diagnosis)
            .s3FileMetadata(analyzedImageMetadata)
            .imagoCount(totalImagoCount)
            .larvaCount(totalLarvaCount)
            .build();
    }

    private void saveAnalyzedDiseases(AnalyzedPhoto analyzedPhoto, DiagnosisApiResponse.DiagnosisResult result) {
        saveAnalyzedPhotoDisease(analyzedPhoto, "VARROA", true, result.getLarva().getVarroaCount());
        saveAnalyzedPhotoDisease(analyzedPhoto, "FOULBROOD", true, result.getLarva().getFoulBroodCount());
        saveAnalyzedPhotoDisease(analyzedPhoto, "CHALKBROOD", true, result.getLarva().getChalkBroodCount());

        saveAnalyzedPhotoDisease(analyzedPhoto, "VARROA", false, result.getImago().getVarroaCount());
        saveAnalyzedPhotoDisease(analyzedPhoto, "DWV", false, result.getImago().getDwvCount());
    }

    /**
     * Helper to create and save AnalyzedPhotoDisease only if the count is positive.
     * This method now uses DiseaseRepository to find the Disease entity by its name and stage.
     */
    private void saveAnalyzedPhotoDisease(AnalyzedPhoto analyzedPhoto, String diseaseCodeString, boolean isLarva, Long count) {
        if (count != null && count > 0) {
            DiseaseName diseaseNameEnum;
            try {
                // Convert the input string disease code to the DiseaseName enum
                diseaseNameEnum = DiseaseName.valueOf(diseaseCodeString.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.error(
                    "Unknown disease code string: {}. Cannot convert to DiseaseName enum. Please ensure this disease name is defined in the DiseaseName enum.",
                    diseaseCodeString);
                // Or throw a specific exception if this is a critical error and should halt processing
                return; // Skip saving if disease code string is unknown/not in enum
            }

            // Convert the isLarva boolean to the BeeStage enum
            DiseaseName diseaseName = DiseaseName.valueOf(diseaseCodeString);
            BeeStage beeStageEnum = isLarva ? BeeStage.LARVA : BeeStage.IMAGO;

            Disease disease = diseaseRepository.findByNameAndStage(diseaseName, beeStageEnum);

            AnalyzedPhotoDisease diseaseRecord = AnalyzedPhotoDisease.builder()
                .analyzedPhoto(analyzedPhoto)
                .disease(disease)
                .count(count)
                .build();
            analyzedPhotoDiseaseRepository.save(diseaseRecord);
        }
    }

    @Override
    public List<AllBeehiveResponseDto> getAllBeehives(UserDetailsImpl userDetails) {
        Long memberId = userDetails.getMemberId();
        Members members = membersRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
        Apiary apiary = apiaryRepository.findByMembers(members);

        List<BeehiveDiagnosisProjection> beehiveList = beehiveRepository.findAllBeehiveDto(apiary.getId());

        List<Long> diagnosisIds = beehiveList.stream()
            .map(BeehiveDiagnosisProjection::getLastDiagnosisId)
            .filter(Objects::nonNull)
            .toList();

        Map<Long, Long> statusMap = getStatusEachBeehive(diagnosisIds);

        return beehiveList.stream()
            .map(dto -> new AllBeehiveResponseDto(
                dto.getBeehiveId(),
                dto.getNickname(),
                dto.getCreatedAt(),
                dto.getXDirection(),
                dto.getYDirection(),
                dto.getHornetAppearedAt(),
                dto.getIsInfected(),
                dto.getRecordCreatedAt(),
                dto.getLastDiagnosedAt(),
                dto.getLastDiagnosisId(),
                statusMap.get(dto.getLastDiagnosisId())
            ))
            .toList();
    }

    @Override
    public BeehiveDetailResponseDto getBeehiveDetails(Long beehiveId, Pageable pageable) {
        Page<Diagnosis> diagnosisPage = diagnosisRepository.findDiagnosesByBeehiveId(beehiveId, pageable);

        List<Long> diagnosisIds = new ArrayList<>();
        for (Diagnosis diagnosis : diagnosisPage.getContent()) {
            diagnosisIds.add(diagnosis.getId());
        }

        List<AnalyzedPhotoResultDto> analyzedPhotoIds = analyzedPhotoRepository.getAnalyzedPhotosByDiagnosisIdIn(diagnosisIds);

        List<Long> analyzedPhotoIdList = new ArrayList<>();
        for (AnalyzedPhotoResultDto analyzedPhotoResultDto : analyzedPhotoIds) {
            analyzedPhotoIdList.add(analyzedPhotoResultDto.analyzedPhotoId());
        }

        List<DiagnosisResultProjection> diagnosisResultList = analyzedPhotoDiseaseRepository.getDiagnosisResultByAnalyzedPhotoIds(
            analyzedPhotoIdList);

        List<BeehiveDiagnosisInfoDto> beehiveDiagnosisInfoList = new ArrayList<>();

        for (DiagnosisResultProjection diagnosisResultProjection : diagnosisResultList) {
            TotalCountImagoLarvaProjection totalCountByDiagnosis = analyzedPhotoRepository.getTotalCountByDiagnosis(
                diagnosisResultProjection.getDiagnosisId());
            Long totalLarva = totalCountByDiagnosis.getLarvaCount();
            Long totalImago = totalCountByDiagnosis.getImagoCount();

            double larvaVarroaRatio = calculateDiseaseRatio(diagnosisResultProjection.getLarvavarroaCount(), totalLarva);
            double larvaFoulBroodRatio = calculateDiseaseRatio(diagnosisResultProjection.getLarvafoulBroodCount(), totalLarva);
            double larvaChalkBroodRatio = calculateDiseaseRatio(diagnosisResultProjection.getLarvachalkBroodCount(), totalLarva);
            double imagoVarroaRatio = calculateDiseaseRatio(diagnosisResultProjection.getImagovarroaCount(), totalImago);
            double imagoDwvRatio = calculateDiseaseRatio(diagnosisResultProjection.getImagodwvCount(), totalImago);

            Larva larva = new Larva(
                diagnosisResultProjection.getLarvavarroaCount(),
                larvaVarroaRatio,
                diagnosisResultProjection.getLarvafoulBroodCount(),
                larvaFoulBroodRatio,
                diagnosisResultProjection.getLarvachalkBroodCount(),
                larvaChalkBroodRatio
            );

            Imago imago = new Imago(
                diagnosisResultProjection.getImagovarroaCount(),
                imagoVarroaRatio,
                diagnosisResultProjection.getImagodwvCount(),
                imagoDwvRatio
            );

            DiagnosisResultDto diagnosisResultDto = new DiagnosisResultDto(larva, imago);

            BeehiveDiagnosisInfoDto beehiveDiagnosisInfoDto = new BeehiveDiagnosisInfoDto(
                diagnosisResultProjection.getDiagnosisId(),
                diagnosisResultProjection.getCreatedAt(),
                totalImago,
                totalLarva,
                diagnosisResultDto
            );

            beehiveDiagnosisInfoList.add(beehiveDiagnosisInfoDto);
        }

        PageInfoDto pageInfoDto = createPageInfo(diagnosisPage);

        Optional<Beehive> beehive = beehiveRepository.findById(beehiveId);
        if (beehive.isEmpty()) {
            throw new BeehiveNotFoundException();
        }

        Turret turret = turretRepository.findByBeehive(beehive.get()).orElse(null);
        return new BeehiveDetailResponseDto(
            beehiveDiagnosisInfoList,
            pageInfoDto,
            beehive.get().getNickname(),
            (turret != null ? turret.getId() : null)
        );
    }

    private PageInfoDto createPageInfo(Page<Diagnosis> diagnosisPage) {
        Long page = (long)diagnosisPage.getNumber();
        Long size = (long)diagnosisPage.getSize();
        Long totalElements = diagnosisPage.getTotalElements();
        Long totalPages = (long)diagnosisPage.getTotalPages();
        Boolean hasPreviousPage = diagnosisPage.hasPrevious();
        Boolean hasNextPage = diagnosisPage.hasNext();

        return new PageInfoDto(page, size, totalElements, totalPages, hasPreviousPage, hasNextPage);
    }

    private double calculateDiseaseRatio(Long diseaseCount, Long totalCount) {
        if (totalCount == 0)
            return 0;
        return (double)diseaseCount / totalCount * 100;
    }

    private Map<Long, Long> getStatusEachBeehive(List<Long> diagnosisIds) {
        List<OriginalPhotoStatusDto> statusList = originalPhotoRepository.findStatusesByDiagnosisIds(diagnosisIds);
        Map<Long, List<DiagnosisStatus>> group = new HashMap<>();

        for (OriginalPhotoStatusDto originalPhotoStatusDto : statusList) {
            group.computeIfAbsent(originalPhotoStatusDto.diagnosisId(), k -> new ArrayList<>()).add(originalPhotoStatusDto.status());
        }

        return calculateStatus(group);
    }

    private Map<Long, Long> calculateStatus(Map<Long, List<DiagnosisStatus>> group) {
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
    public List<DiagnosisResponseDto> generateDiagnosisPresignedUrl(DiagnosisDto dto) {
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

        List<Photo> photos = dto.photos();
        List<DiagnosisResponseDto> response = new ArrayList<>();

        for (Photo photo : photos) {
            GeneratePutUrlResponse putUrlDto = s3PresignService.generatePutUrl(photo.filename(), photo.contentType());
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
                .filename(photo.filename())
                .status(status)
                .preSignedUrl(putUrl)
                .build();
            response.add(build);
        }

        return response;
    }

}
