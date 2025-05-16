package com.worldbeesion.beecareful.beehive.service;

import static com.worldbeesion.beecareful.common.util.S3Util.*;

import com.worldbeesion.beecareful.beehive.constant.BeeStage;
import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;
import com.worldbeesion.beecareful.beehive.constant.DiseaseName;
import com.worldbeesion.beecareful.beehive.exception.BeehiveNotFoundException;
import com.worldbeesion.beecareful.beehive.exception.DirectionDuplicateException;
import com.worldbeesion.beecareful.beehive.exception.DirectionNullException;
import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.beehive.model.entity.*;
import com.worldbeesion.beecareful.beehive.repository.*;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.member.exception.BadRequestException;
import com.worldbeesion.beecareful.member.exception.MemberNotFoundException;
import com.worldbeesion.beecareful.member.model.Members;
import com.worldbeesion.beecareful.member.repository.MembersRepository;

import com.worldbeesion.beecareful.s3.constant.S3FileStatus;
import com.worldbeesion.beecareful.s3.model.dto.GeneratePutUrlResponse;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.repository.S3FileMetadataRepository;
import com.worldbeesion.beecareful.s3.service.S3PresignService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;

import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisApiResponse;

@Service
@RequiredArgsConstructor
@Slf4j
public class BeehiveServiceImpl implements BeehiveService {

    private final S3PresignService s3PresignService;
    private final AiDiagnosisService aiDiagnosisService;
    private final S3FileMetadataRepository s3FileMetadataRepository;

    private final BeehiveRepository beehiveRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final OriginalPhotoRepository originalPhotoRepository;
    private final ApiaryRepository apiaryRepository;
    private final MembersRepository membersRepository;
    private final AnalyzedPhotoRepository analyzedPhotoRepository;
    private final AnalyzedPhotoDiseaseRepository analyzedPhotoDiseaseRepository;
    private final TurretRepository turretRepository;
    private final DiseaseRepository diseaseRepository;

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
    @Transactional // This transaction primarily covers the initial Diagnosis fetch.
    // Async operations run in their own transactions by default.
    public void runDiagnosis(Long diagnosisId) {
        log.info("Starting diagnosis process for diagnosisId: {}", diagnosisId);

        // 1. Retrieve Diagnosis entity
        Diagnosis diagnosis = diagnosisRepository.findById(diagnosisId)
            .orElseThrow(() -> {
                log.error("Diagnosis not found for ID: {}", diagnosisId);
                return new BadRequestException();
            });

        // 2. Retrieve all OriginalPhoto entities associated with this Diagnosis
        List<OriginalPhoto> originalPhotos = originalPhotoRepository.findAllByDiagnosisId(diagnosisId);

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
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
            log.info("All photo processing tasks completed for diagnosisId: {}", diagnosisId);

        } catch (Exception e) {
            // This catch block might capture CompletionException if any future failed unexpectedly *during join*
            log.error("Error occurred while waiting for all photo processing tasks for diagnosisId: {}", diagnosisId, e);
        }

        log.info("Finished diagnosis process for diagnosisId: {}", diagnosisId);
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
            DiagnosisApiResponse diagnosisApiResponse = aiDiagnosisService.analyzePhoto(originalS3Key)
                .block(Duration.ofSeconds(120)); // Increased timeout for AI call + parsing

            if (diagnosisApiResponse == null) {
                log.error("[DiagnosisId: {}, PhotoId: {}] AI analysis returned no data.", diagnosis.getId(), photoId);
                throw new IllegalStateException("AI analysis returned null data.");
            }

            DiagnosisApiResponse.DiagnosisResult diagResult = diagnosisApiResponse.diagnosis();
            String analyzedImageS3Key = diagnosisApiResponse.analyzedImageS3Key();

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
            log.debug("[DiagnosisId: {}, PhotoId: {}] Saved AnalyzedPhoto entity with ID: {}",
                diagnosis.getId(), photoId, analyzedPhoto.getId());

            // Save associated disease details
            saveAnalyzedPhotoDiseases(analyzedPhoto, diagResult);
            log.debug("[DiagnosisId: {}, PhotoId: {}] Saved AnalyzedPhotoDisease entities.", diagnosis.getId(), photoId);

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

    private AnalyzedPhoto createAnalyzedPhotoEntity(
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

    /**
     * Saves all detected diseases for a given analyzed photo or diagnosis.
     * If analyzedPhoto is null, the method will create DiagnosisDisease entities instead.
     */
    private void saveAnalyzedPhotoDiseases(AnalyzedPhoto analyzedPhoto, DiagnosisApiResponse.DiagnosisResult result) {
        // Larva diseases
        saveAnalyzedPhotoDisease(analyzedPhoto, BeeStage.LARVA, DiseaseName.VARROA, result.larva().varroaCount());
        saveAnalyzedPhotoDisease(analyzedPhoto, BeeStage.LARVA, DiseaseName.FOULBROOD, result.larva().foulBroodCount());
        saveAnalyzedPhotoDisease(analyzedPhoto, BeeStage.LARVA, DiseaseName.CHALKBROOD, result.larva().chalkBroodCount());

        // Imago diseases
        saveAnalyzedPhotoDisease(analyzedPhoto, BeeStage.IMAGO, DiseaseName.VARROA, result.imago().varroaCount());
        saveAnalyzedPhotoDisease(analyzedPhoto, BeeStage.IMAGO, DiseaseName.DWV, result.imago().dwvCount());
    }

    /**
     * Helper to create and save AnalyzedPhotoDisease only if the count is positive.
     * This method now uses DiseaseRepository to find the Disease entity by its name and stage.
     * If analyzedPhoto is null, this method will log the disease details without saving them to the database.
     */
    private void saveAnalyzedPhotoDisease(AnalyzedPhoto analyzedPhoto, BeeStage beeStage, DiseaseName diseaseName, Long count) {
        if (count != null && count > 0) {
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
    @Transactional(readOnly = true)
    public BeehiveDetailResponseDto getBeehiveDetails(Long beehiveId, int month, UserDetailsImpl userDetails) {
        Beehive beehive = beehiveRepository.findById(beehiveId).orElse(null);
        if (beehive == null || beehive.getDeletedAt() != null) {
            throw new BeehiveNotFoundException();
        }

        Members members = membersRepository.findById(userDetails.getMemberId()).orElseThrow(MemberNotFoundException::new);
        Apiary apiary = apiaryRepository.findByMembers(members);
        boolean isExist = beehiveRepository.existsByIdAndApiary(beehiveId, apiary);

        if (!isExist) {
            throw new BeehiveNotFoundException();
        }

        LocalDateTime startDate = LocalDateTime.now().minusMonths(month);
        List<Diagnosis> diagnosisList = diagnosisRepository.findRecentDiagnosesByBeehiveId(beehiveId, startDate);

        List<Long> diagnosisIds = new ArrayList<>();
        for (Diagnosis diagnosis : diagnosisList) {
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

        Turret turret = turretRepository.findByBeehive(beehive).orElse(null);
        Long turretId = null;
        if (turret != null) {
            turretId = turret.getId();
        }

        return new BeehiveDetailResponseDto(
            beehiveDiagnosisInfoList,
            beehive.getNickname(),
            turretId
        );
    }

    @Override
    @Transactional
    public void addTurret(Long beehiveId, TurretRequestDto turretRequestDto) {
        Beehive beehive = beehiveRepository.findById(beehiveId).orElseThrow(BeehiveNotFoundException::new);

        Turret turret = turretRepository.findByBeehive(beehive).orElse(null);

        if (turret != null) {
            turret.updateTurret(turretRequestDto.serial());
            return;
        }

        Turret newTurret = Turret.builder()
            .beehive(beehive)
            .serial(turretRequestDto.serial())
            .build();

        turretRepository.save(newTurret);
    }

    @Override
    @Transactional
    public void updateBeehive(Long beehiveId, BeehiveUpdateDto beehiveUpdateDto, UserDetailsImpl userDetails) {
        Beehive beehive = beehiveRepository.findById(beehiveId).orElseThrow(BeehiveNotFoundException::new);

        if (beehiveUpdateDto.xDirection() == null || beehiveUpdateDto.yDirection() == null) {
            throw new DirectionNullException();
        }

        Members members = membersRepository.findById(userDetails.getMemberId()).orElseThrow(MemberNotFoundException::new);
        Apiary apiary = apiaryRepository.findByMembers(members);

        boolean isLocated = beehiveRepository.existsByApiaryAndDirection(
            apiary,
            beehiveUpdateDto.xDirection(),
            beehiveUpdateDto.yDirection()
        );

        if (isLocated) {
            throw new DirectionDuplicateException();
        }

        beehive.updateNickname(beehiveUpdateDto.nickname());
        beehive.updateDirection(beehiveUpdateDto.xDirection(), beehiveUpdateDto.yDirection());
    }

    @Override
    @Transactional
    public void deleteBeehive(Long beehiveId, UserDetailsImpl userDetails) {
        Beehive beehive = beehiveRepository.findById(beehiveId).orElse(null);
        if (beehive == null || beehive.getDeletedAt() != null) {
            throw new BeehiveNotFoundException();
        }

        Members members = membersRepository.findById(userDetails.getMemberId()).orElseThrow(MemberNotFoundException::new);
        Apiary apiary = apiaryRepository.findByMembers(members);
        boolean isExist = beehiveRepository.existsByIdAndApiary(beehiveId, apiary);

        if (!isExist) {
            throw new BeehiveNotFoundException();
        }

        beehive.delete();

    }

    private double calculateDiseaseRatio(Long diseaseCount, Long totalCount) {
        if (totalCount == 0)
            return 0;
        return (double)diseaseCount / totalCount * 100;
    }

    /**
     * Sums up all the diagnosis results from multiple photos.
     *
     * @param diagnosisResults List of diagnosis results to sum up
     * @return A single DiagnosisResult containing the summed up values
     */
    private DiagnosisApiResponse.DiagnosisResult sumUpDiagnosisResults(List<DiagnosisApiResponse.DiagnosisResult> diagnosisResults) {
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
