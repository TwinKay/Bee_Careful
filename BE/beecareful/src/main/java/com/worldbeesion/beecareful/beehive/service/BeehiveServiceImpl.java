package com.worldbeesion.beecareful.beehive.service;


import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;
import com.worldbeesion.beecareful.beehive.exception.BeehiveNotFoundException;
import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.beehive.model.entity.*;
import com.worldbeesion.beecareful.beehive.repository.*;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.member.exception.MemberNotFoundException;
import com.worldbeesion.beecareful.member.model.Members;
import com.worldbeesion.beecareful.member.repository.MembersRepository;
import com.worldbeesion.beecareful.s3.model.dto.GeneratePutUrlResponse;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.service.S3FileService;
import com.worldbeesion.beecareful.s3.service.S3PresignService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;


@Service
@RequiredArgsConstructor
public class BeehiveServiceImpl implements BeehiveService{

    private final S3FileService s3FileService;
    private final S3PresignService s3PresignService;
    private final BeehiveRepository beehiveRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final OriginalPhotoRepository originalPhotoRepository;
    private final ApiaryRepository apiaryRepository;
    private final MembersRepository membersRepository;
    private final AnalyzedPhotoRepository analyzedPhotoRepository;
    private final AnalyzedPhotoDiseaseRepository analyzedPhotoDiseaseRepository;
    private final TurretRepository turretRepository;

    @Override
    @Transactional
    public void addBeehive(BeehiveRequestDto beehiveRequestDto, UserDetailsImpl userDetails) {
        String nickname = beehiveRequestDto.nickname();
        Long xDirection = beehiveRequestDto.xDirection();
        Long yDirection = beehiveRequestDto.yDirection();

        Long memberId = userDetails.getMemberId();
        Members members = membersRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);

        Apiary apiary = apiaryRepository.findByMembers(members);

        Beehive beehive = Beehive.builder()
                .apiary(apiary)
                .nickname(nickname)
                .xDirection(xDirection)
                .yDirection(yDirection)
                .isInfected(false)
                .build();

        beehiveRepository.save(beehive);
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
        for(Diagnosis diagnosis : diagnosisPage.getContent()) {
            diagnosisIds.add(diagnosis.getId());
        }

        List<AnalyzedPhotoResultDto> analyzedPhotoIds = analyzedPhotoRepository.getAnalyzedPhotosByDiagnosisIdIn(diagnosisIds);

        List<Long> analyzedPhotoIdList = new ArrayList<>();
        for(AnalyzedPhotoResultDto analyzedPhotoResultDto : analyzedPhotoIds) {
            analyzedPhotoIdList.add(analyzedPhotoResultDto.analyzedPhotoId());
        }


        List<DiagnosisResultProjection> diagnosisResultList = analyzedPhotoDiseaseRepository.getDiagnosisResultByAnalyzedPhotoIds(analyzedPhotoIdList);

        List<BeehiveDiagnosisInfoDto> beehiveDiagnosisInfoList = new ArrayList<>();

        for(DiagnosisResultProjection diagnosisResultProjection : diagnosisResultList) {
            TotalCountImagoLarvaProjection totalCountByDiagnosis = analyzedPhotoRepository.getTotalCountByDiagnosis(diagnosisResultProjection.getDiagnosisId());
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
        if(beehive.isEmpty()) {
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

    @Override
    public void addTurret(Long beehiveId, TurretRequestDto turretRequestDto) {
        Optional<Beehive> beehive = beehiveRepository.findById(beehiveId);
        if(beehive.isEmpty()) {
            throw new BeehiveNotFoundException();
        }

        Turret turret = Turret.builder()
                .beehive(beehive.get())
                .serial(turretRequestDto.serial())
                .build();

        turretRepository.save(turret);
    }

    @Override
    @Transactional
    public void updateBeehive(Long beehiveId, BeehiveUpdateDto beehiveUpdateDto) {
        Optional<Beehive> beehive = beehiveRepository.findById(beehiveId);
        if(beehive.isEmpty()) {
            throw new BeehiveNotFoundException();
        }
        beehive.get().updateNickname(beehiveUpdateDto.nickname());
        beehive.get().updateXDirection(beehiveUpdateDto.xDirection());
        beehive.get().updateYDirection(beehiveUpdateDto.yDirection());
    }

    private PageInfoDto createPageInfo(Page<Diagnosis> diagnosisPage) {
        Long page = (long) diagnosisPage.getNumber();
        Long size = (long) diagnosisPage.getSize();
        Long totalElements = diagnosisPage.getTotalElements();
        Long totalPages = (long) diagnosisPage.getTotalPages();
        Boolean hasPreviousPage = diagnosisPage.hasPrevious();
        Boolean hasNextPage = diagnosisPage.hasNext();

        return new PageInfoDto(page, size, totalElements, totalPages, hasPreviousPage, hasNextPage);
    }

    private double calculateDiseaseRatio(Long diseaseCount, Long totalCount) {
        if (totalCount == 0) return 0;
        return (double) diseaseCount / totalCount * 100;
    }


    private Map<Long, Long> getStatusEachBeehive(List<Long> diagnosisIds) {
        List<OriginalPhotoStatusDto> statusList = originalPhotoRepository.findStatusesByDiagnosisIds(diagnosisIds);
        Map<Long, List<DiagnosisStatus>> group = new HashMap<>();

        for(OriginalPhotoStatusDto originalPhotoStatusDto : statusList) {
            group.computeIfAbsent(originalPhotoStatusDto.diagnosisId(), k -> new ArrayList<>()).add(originalPhotoStatusDto.status());
        }

        return calculateStatus(group);
    }


    private Map<Long, Long> calculateStatus(Map<Long, List<DiagnosisStatus>> group) {
        Map<Long, Long> result = new HashMap<>();
        for(Map.Entry<Long, List<DiagnosisStatus>> entry : group.entrySet()) {
            List<DiagnosisStatus> diagnosisStatuses = entry.getValue();
            if(diagnosisStatuses.contains(DiagnosisStatus.FAIL) || diagnosisStatuses.contains(DiagnosisStatus.UNRECIEVED)) {
                result.put(entry.getKey(), 2L);
            } else if (diagnosisStatuses.contains(DiagnosisStatus.WAITING) || diagnosisStatuses.contains(DiagnosisStatus.ANALYZING)) {
                result.put(entry.getKey(), 0L);
            } else {
                result.put(entry.getKey(), 1L);
            }
        }
        return result;
    }


    @Transactional
    public List<DiagnosisResponseDto> generateDiagnosisPresignedUrl(DiagnosisDto dto){
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
        List<DiagnosisResponseDto> response= new ArrayList<>();

        for(Photo photo : photos){
            GeneratePutUrlResponse putUrlDto = s3PresignService.generatePutUrl(photo.filename(),photo.contentType());
            S3FileMetadata s3FileMetadata = putUrlDto.s3FileMetadata();
            String putUrl = putUrlDto.preSignedUrl();

            OriginalPhoto originalPhoto = OriginalPhoto.builder()
                    .diagnosis(diagnosis)
                    .s3FileMetadata(s3FileMetadata)
                    .status(DiagnosisStatus.WAITING)
                    .build();

            originalPhotoRepository.save(originalPhoto);

            int status = 0;
            if(null == putUrl || putUrl.isEmpty()){
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
