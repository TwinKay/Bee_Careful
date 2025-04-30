package com.ssafy.beecareful.s3.service;

import com.ssafy.beecareful.s3.constant.FilePathPrefix;
import com.ssafy.beecareful.s3.entity.S3FileMetadata;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;


public interface S3FileService {
    S3FileMetadata putObject(MultipartFile file, FilePathPrefix filePathPrefix);
    List<S3FileMetadata> putObjects(List<MultipartFile> files, FilePathPrefix filePathPrefix);


    // return 뭐로할지 못정했어요
    int deleteObject(Long s3FileMetadataId);
    int deleteObjects(List<Long> s3FileMetadataIdList);

}