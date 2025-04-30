package com.ssafy.beecareful.s3.dto;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;


public class S3FileUploadDto {

    public record Request(Long memberId, List<MultipartFile> images){

    }

//    public record Response(List<>){}
}
