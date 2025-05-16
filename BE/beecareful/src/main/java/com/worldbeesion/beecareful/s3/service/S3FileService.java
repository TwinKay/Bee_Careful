package com.worldbeesion.beecareful.s3.service;

import com.worldbeesion.beecareful.s3.constant.FilePathPrefix;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import org.springframework.web.multipart.MultipartFile;


public interface S3FileService {
    S3FileMetadata putObject(MultipartFile file, FilePathPrefix filePathPrefix);

    S3FileMetadata putObject(byte[] fileData, String filename, String contentType, FilePathPrefix filePathPrefix);

    int deleteObject(Long s3FileMetadataId);

}