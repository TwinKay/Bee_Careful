package com.worldbeesion.beecareful.s3.service;

import com.worldbeesion.beecareful.common.exception.BadRequestException;
import com.worldbeesion.beecareful.s3.constant.FilePathPrefix;
import com.worldbeesion.beecareful.s3.constant.FileStatus;
import com.worldbeesion.beecareful.s3.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.exception.FileUploadFailException;
import com.worldbeesion.beecareful.s3.exception.S3ConnectionException;
import com.worldbeesion.beecareful.s3.repository.S3FileMetadataRepository;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;


@Service
@Slf4j
public class S3FileServiceImpl implements S3FileService {
    private final S3Client s3Client;
    private final String bucketName;
    private final String region;
    private final List<String> allowedExtensions;

    private final S3FileMetadataRepository s3FileMetadataRepository;

    public S3FileServiceImpl(
            @Value("${cloud.aws.s3.bucket}") String bucketName,
            @Value("${cloud.aws.region.static}") String region
            , S3Client s3Client
            , S3FileMetadataRepository s3FileMetadataRepository) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.region = region;
        this.allowedExtensions = Arrays.asList("jpg", "png", "gif", "jpeg","webp");
        this.s3FileMetadataRepository = s3FileMetadataRepository;
    }

    @Override
    @Transactional(noRollbackFor = { S3Exception.class})
    public S3FileMetadata putObject(MultipartFile file, FilePathPrefix filePathPrefix) {
        String s3Key = filePathPrefix.getPrefix() + generateUniqueFilename(file);
        S3FileMetadata entity = S3FileMetadata.builder()
                .originalFilename(file.getOriginalFilename())
                .s3Key(s3Key)
                .size(file.getSize())
                .url("https://" + bucketName + ".s3." + region + ".amazonaws.com/" + s3Key)
                .contentType(file.getContentType())
                .status(FileStatus.PENDING)
                .build();
        s3FileMetadataRepository.save(entity);
        try{
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
            PutObjectResponse response = s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
            if(response.sdkHttpResponse().isSuccessful()){
                entity.setStatus(FileStatus.STORED);
            }else{
                entity.setStatus(FileStatus.FAILED);
                throw new FileUploadFailException();
            }
        }catch(S3Exception e){
            throw e;
        }catch (Exception e){

        }

        return entity;
    }


    //
    @Override
    @Transactional(noRollbackFor = S3ConnectionException.class)
    public int deleteObject(Long s3FileMetadataId) {

        S3FileMetadata s3FileMetadata = s3FileMetadataRepository.findById(s3FileMetadataId)
                .orElseThrow(BadRequestException::new);

        try{
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3FileMetadata.getS3Key())
                    .build();
            DeleteObjectResponse deleteObjectResponse = s3Client.deleteObject(deleteObjectRequest);
            if(deleteObjectResponse.sdkHttpResponse().isSuccessful()){
                s3FileMetadata.remove();
            }else{
                throw new S3ConnectionException();
            }
        }catch (S3Exception e){
            throw new S3ConnectionException();
        }
        return 0;
    }
    private String generateUniqueFilename(MultipartFile multipartFile) {
        String originalFilename = multipartFile.getOriginalFilename();
        String fileExtension = validateFileExtension(originalFilename);
        return UUID.randomUUID() + "." + fileExtension;
    }

    private String validateFileExtension(String originalFilename) {
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();

        if (!allowedExtensions.contains(fileExtension)) {
            log.error("지원하지않는 파일 확장자입니다 : "+ fileExtension);
//            throw new ImageExtensionNotSupportedException();
        }
        return fileExtension;
    }

}