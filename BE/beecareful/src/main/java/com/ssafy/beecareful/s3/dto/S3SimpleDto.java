package com.ssafy.beecareful.s3.dto;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public class S3SimpleDto {

    public record Request(List<MultipartFile> images, List<String> names){}
}
