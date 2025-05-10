package com.worldbeesion.beecareful.beehive.service;


import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisRequestDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResponseDto;
import com.worldbeesion.beecareful.beehive.model.dto.Photo;
import com.worldbeesion.beecareful.beehive.model.entity.Beehive;
import com.worldbeesion.beecareful.beehive.model.entity.Diagnosis;
import com.worldbeesion.beecareful.beehive.model.entity.OriginalPhoto;
import com.worldbeesion.beecareful.beehive.repository.BeehiveRepository;
import com.worldbeesion.beecareful.beehive.repository.DiagnosisRepository;
import com.worldbeesion.beecareful.beehive.repository.OriginalPhotoRepository;
import com.worldbeesion.beecareful.s3.model.dto.GeneratePutUrlResponse;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.service.S3FileService;
import com.worldbeesion.beecareful.s3.service.S3PresignService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BeehiveServiceImpl implements BeehiveService{

    private final S3FileService s3FileService;
    private final S3PresignService s3PresignService;
    private final BeehiveRepository beehiveRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final OriginalPhotoRepository originalPhotoRepository;


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
            GeneratePutUrlResponse putUrlDto = s3PresignService.generatePutUrl(photo.filename());
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
