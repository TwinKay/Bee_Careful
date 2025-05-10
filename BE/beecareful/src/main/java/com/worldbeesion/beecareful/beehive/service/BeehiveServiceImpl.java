package com.worldbeesion.beecareful.beehive.service;


import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisRequestDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResponseDto;
import com.worldbeesion.beecareful.beehive.model.dto.Photo;
import com.worldbeesion.beecareful.s3.service.S3FileService;
import com.worldbeesion.beecareful.s3.service.S3PresignService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BeehiveServiceImpl implements BeehiveService{

    private final S3FileService s3FileService;
    private final S3PresignService s3PresignService;


    @Transactional
    public List<DiagnosisResponseDto> generateDiagnosisPresignedUrl(DiagnosisRequestDto dto){
        //TODO 파일 메타데이터 처리, s3Presigned 제약조건
        List<Photo> photos = dto.photos();
        return photos.stream()
                .map((photo)->{
                    String putUrl = s3PresignService.generatePutUrl(photo.filename());
                    int status = 0;
                    if(putUrl.isEmpty()){
                        status = 1;
                    }
                    return DiagnosisResponseDto.builder()
                            .filename(photo.filename())
                            .status(status)
                            .preSignedUrl(putUrl)
                            .build();
                })
                .toList();
    }

}
