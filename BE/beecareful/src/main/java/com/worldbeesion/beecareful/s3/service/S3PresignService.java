package com.worldbeesion.beecareful.s3.service;

import com.worldbeesion.beecareful.s3.constant.FilePathPrefix;
import com.worldbeesion.beecareful.s3.constant.S3FileStatus;
import com.worldbeesion.beecareful.s3.model.dto.GeneratePutUrlResponse;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import com.worldbeesion.beecareful.s3.repository.S3FileMetadataRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;


@Service
public class S3PresignService {
    private static final Duration PUT_EXPIRATION = Duration.ofMinutes(10);
    private static final Duration GET_EXPIRATION = Duration.ofMinutes(60);
    private static final List<String> allowedExtensions = Arrays.asList("jpg", "png", "gif", "jpeg","webp");

    private final S3FileMetadataRepository s3FileMetadataRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final S3Presigner presigner;
    private final String bucketName;

    public S3PresignService(
            RedisTemplate<String,String> redisTemplate,
            S3FileMetadataRepository s3FileMetadataRepository,
            S3Presigner s3Presigner,
            @Value("${cloud.aws.s3.bucket}") String bucketName){
        this.s3FileMetadataRepository = s3FileMetadataRepository;
        this.presigner = s3Presigner;
        this.redisTemplate = redisTemplate;
        this.bucketName = bucketName;
    }


    @Transactional
    public GeneratePutUrlResponse generatePutOriginPhotoUrl(String originalFilename, String contentType, Long expectedSize) {

        String s3Key = FilePathPrefix.BEEHIVE_ORIGIN.getPrefix() + generateUniqueFilename(contentType.split("/")[1] );

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(contentType)
                .build();

        PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(builder -> builder
                .signatureDuration(PUT_EXPIRATION)
                .putObjectRequest(objectRequest)
        );

        S3FileMetadata s3FileMetadata = S3FileMetadata.builder()
                .s3Key(s3Key)
                .originalFilename(originalFilename)
                .size(expectedSize)
                .status(S3FileStatus.PENDING)
                .contentType(contentType)
                .build();

        S3FileMetadata save = s3FileMetadataRepository.save(s3FileMetadata);

        String url = presignedRequest.url().toString();
        GeneratePutUrlResponse response = GeneratePutUrlResponse.builder()
                .preSignedUrl(url)
                .s3FileMetadata(s3FileMetadata).build();
        return response;
    }

    // GET 용 Presigned URL 생성 (조회용)
    public String generateGetUrl(S3FileMetadata s3FileMetadata) {

        String s3Key = s3FileMetadata.getS3Key();
        String cacheKey = "s3:presigned:get:" + s3Key;
        String url = redisTemplate.opsForValue().get(cacheKey);

        if(null!=url){
            return url;
        }

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        PresignedGetObjectRequest presignedGetRequest = presigner.presignGetObject(builder -> builder
                .signatureDuration(GET_EXPIRATION)
                .getObjectRequest(getObjectRequest)
        );
        String getUrl = presignedGetRequest.url().toString();
        redisTemplate.opsForValue().set(cacheKey,getUrl);

        return getUrl;
    }

    private String generateUniqueFilename(String fileExtension) {
        return UUID.randomUUID() + "." + fileExtension;
    }

//    public String generateGetUrl(String s3Key, String bucketName) {
//
//        String cacheKey = "s3:presigned:get:" + s3Key;
//        String url = redisTemplate.opsForValue().get(cacheKey);
//
//        if(null!=url){
//            return url;
//        }
//
//        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
//                .bucket(bucketName)
//                .key(s3Key)
//                .build();
//
//        PresignedGetObjectRequest presignedGetRequest = presigner.presignGetObject(builder -> builder
//                .signatureDuration(GET_EXPIRATION)
//                .getObjectRequest(getObjectRequest)
//        );
//        String getUrl = presignedGetRequest.url().toString();
//        redisTemplate.opsForValue().set(cacheKey,getUrl);
//
//        return getUrl;
//    }
}