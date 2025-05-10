package com.worldbeesion.beecareful.s3.model.dto;

import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import lombok.Builder;

@Builder
public record GeneratePutUrlResponse (
    String preSignedUrl,
    S3FileMetadata s3FileMetadata
){}
