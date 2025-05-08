package com.worldbeesion.beecareful.s3.service;

import com.worldbeesion.beecareful.s3.entity.S3FileMetadata;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

@RequiredArgsConstructor
@Service
public class S3PresignService {

    private final S3Presigner presigner;
    private final RedisTemplate<String, String> redisTemplate;

    private static final Duration PUT_EXPIRATION = Duration.ofMinutes(10);
    private static final Duration GET_EXPIRATION = Duration.ofMinutes(60);

    public String generatePutUrl(String originalFilename, String bucketName) {
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(originalFilename)
                .contentType("image/png") // 필요에 따라 조정
                .build();

        PresignedPutObjectRequest presignedRequest = presigner.presignPutObject(builder -> builder
                .signatureDuration(PUT_EXPIRATION) // 유효시간 설정
                .putObjectRequest(objectRequest)
        );
        return presignedRequest.url().toString();
    }

    // GET 용 Presigned URL 생성 (조회용)
    public String generateGetUrl(S3FileMetadata s3FileMetadata, String bucketName) {

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