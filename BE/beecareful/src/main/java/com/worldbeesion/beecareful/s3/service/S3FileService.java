package com.worldbeesion.beecareful.s3.service;

import com.worldbeesion.beecareful.s3.constant.FilePathPrefix;
import com.worldbeesion.beecareful.s3.entity.S3FileMetadata;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;


public interface S3FileService {
    S3FileMetadata putObject(MultipartFile file, FilePathPrefix filePathPrefix);

    int deleteObject(Long s3FileMetadataId);

}