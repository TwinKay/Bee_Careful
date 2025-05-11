package com.worldbeesion.beecareful.beehive.service;


import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;
import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.beehive.model.entity.Apiary;
import com.worldbeesion.beecareful.beehive.model.entity.Beehive;
import com.worldbeesion.beecareful.beehive.model.entity.Diagnosis;
import com.worldbeesion.beecareful.beehive.model.entity.OriginalPhoto;
import com.worldbeesion.beecareful.beehive.repository.ApiaryRepository;
import com.worldbeesion.beecareful.beehive.repository.BeehiveRepository;
import com.worldbeesion.beecareful.beehive.repository.DiagnosisRepository;
import com.worldbeesion.beecareful.beehive.repository.OriginalPhotoRepository;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.member.exception.MemberNotFoundException;
import com.worldbeesion.beecareful.member.model.Members;
import com.worldbeesion.beecareful.member.repository.MembersRepository;
import com.worldbeesion.beecareful.s3.model.dto.GeneratePutUrlResponse;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.service.S3FileService;
import com.worldbeesion.beecareful.s3.service.S3PresignService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import static com.worldbeesion.beecareful.common.util.TypeConversionUtil.toBoolean;
import static com.worldbeesion.beecareful.common.util.TypeConversionUtil.toLocalDateTime;

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

        List<Object[]> result = beehiveRepository.findAllBeehiveDto(apiary.getId());

        List<BeehiveDiagnosisDto> beehiveList = result.stream()
                .map(row -> new BeehiveDiagnosisDto(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        toLocalDateTime(row[2]),
                        ((Number) row[3]).longValue(),
                        ((Number) row[4]).longValue(),
                        toLocalDateTime(row[5]),
                        toBoolean(row[6]),
                        toLocalDateTime(row[7]),
                        toLocalDateTime(row[8]),
                        row[9] != null ? ((Number) row[9]).longValue() : null
                ))
                .toList();

        List<Long> diagnosisIds = beehiveList.stream()
                .map(BeehiveDiagnosisDto::lastDiagnosisId)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, Long> statusMap = getStatusEachBeehive(diagnosisIds); // 진단 ID별 상태

        List<AllBeehiveResponseDto> beehiveResult = new ArrayList<>();
        for (BeehiveDiagnosisDto dto : beehiveList) {
            Long status = statusMap.get(dto.lastDiagnosisId());
            beehiveResult.add(new AllBeehiveResponseDto(
                    dto.beehiveId(), dto.nickname(), dto.createdAt(), dto.xDirection(), dto.yDirection(),
                    dto.hornetAppearedAt(), dto.isInfected(), dto.recordCreatedAt(), dto.lastDiagnosedAt(),
                    dto.lastDiagnosisId(), status
            ));
        }

        return beehiveResult;
    }


    @Override
    public Map<Long, Long> getStatusEachBeehive(List<Long> diagnosisIds) {
        List<OriginalPhotoStatusDto> statusList = originalPhotoRepository.findStatusesByDiagnosisIds(diagnosisIds);
        Map<Long, List<DiagnosisStatus>> group = new HashMap<>();

        for(OriginalPhotoStatusDto originalPhotoStatusDto : statusList) {
            group.computeIfAbsent(originalPhotoStatusDto.diagnosisId(), k -> new ArrayList<>()).add(originalPhotoStatusDto.status());
        }

        return calculateStatus(group);
    }

    @Override
    public Map<Long, Long> calculateStatus(Map<Long, List<DiagnosisStatus>> group) {
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
