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
        Page<Diagnosis> diagnosisPage = diagnosisRepository.findByBeehiveId(beehiveId, pageable);

        for (Diagnosis diagnosis : diagnosisPage.getContent()) {
            System.out.println("Diagnosis id: " + diagnosis.getId());
            System.out.println("Diagnosis createdAt: " + diagnosis.getCreatedAt());
            // 필요한 다른 필드를 출력
        }



        List<Long> diagnosisIds = new ArrayList<>();
        for(Diagnosis diagnosis : diagnosisPage.getContent()) {
            diagnosisIds.add(diagnosis.getId());
        }

        if (diagnosisIds.isEmpty()) {
            System.out.println("========================DiagnosisId 리스트가 비어있음=========================");
        }

        List<AnalyzedPhotoResultDto> analyzedPhotoIds = analyzedPhotoRepository.getAnalyzedPhotosByDiagnosisIds(diagnosisIds);

        if (analyzedPhotoIds.isEmpty()) {
            System.out.println("=============================analyzed포토아이디리스트 비어있음============================");
        }

        List<Long> analyzedPhotoIdList = new ArrayList<>();
        for(AnalyzedPhotoResultDto analyzedPhotoResultDto : analyzedPhotoIds) {
            analyzedPhotoIdList.add(analyzedPhotoResultDto.analyzedPhotoId());
        }

        if(analyzedPhotoIdList.isEmpty()) {
            System.out.println("===============================전체 분석 아이디 없음=============================");
        }


        List<DiagnosisResultProjection> diagnosisResultList = analyzedPhotoDiseaseRepository.getDiagnosisResultByAnalyzedPhotoIds(analyzedPhotoIdList);

        if(diagnosisResultList.isEmpty()) {
            System.out.println("=====================결과 가지고 오는 리스트 비어있음=======================");
        }

        // 반환된 리스트의 첫 번째 항목을 확인
        if (!diagnosisResultList.isEmpty()) {
            DiagnosisResultProjection firstItem = diagnosisResultList.get(0);
            System.out.println("첫 번째 인자 제발 있나요 : " + firstItem.getDiagnosisId());
            System.out.println("두 번째 인자(날짜) : " + firstItem.getCreatedAt());
            System.out.println("세 번째 인자 : " + firstItem.getImagodwvCount());
        } else {
            System.out.println("No diagnosis results found");
        }

        List<BeehiveDiagnosisInfoDto> beehiveDiagnosisInfoList = new ArrayList<>();

        for(DiagnosisResultProjection diagnosisResultProjection : diagnosisResultList) {
            System.out.println("포문 안에 아이디 보기: " + diagnosisResultProjection.getDiagnosisId());
            TotalCountImagoLarvaProjection totalCountByDiagnosis = analyzedPhotoRepository.getTotalCountByDiagnosis(diagnosisResultProjection.getDiagnosisId());
            Long totalLarva = totalCountByDiagnosis.getLarvaCount();
            System.out.println("totalLarva : " + totalLarva);
            Long totalImago = totalCountByDiagnosis.getImagoCount();
            System.out.println("totalImago : " + totalImago);

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
