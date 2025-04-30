package com.ssafy.beecareful.s3.service;

import com.ssafy.beecareful.common.exception.BadRequestException;
import com.ssafy.beecareful.common.exception.InternalServerErrorException;
import com.ssafy.beecareful.s3.constant.FilePathPrefix;
import com.ssafy.beecareful.s3.constant.FileStatus;
import com.ssafy.beecareful.s3.entity.S3FileMetadata;
import com.ssafy.beecareful.s3.exception.FileUploadFailException;
import com.ssafy.beecareful.s3.exception.ImageExtensionNotSupportedException;
import com.ssafy.beecareful.s3.exception.S3ConnectionException;
import com.ssafy.beecareful.s3.repository.S3FileMetadataRepository;
import com.ssafy.beecareful.security.auth.principal.UserDetailsImpl;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
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
    @Transactional(noRollbackFor = { S3Exception.class, FileUploadFailException.class})
    public S3FileMetadata putObject(MultipartFile file, FilePathPrefix filePathPrefix) {
        UserDetailsImpl principal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String memberId = principal.getMemberId();
//        String memberId = "1";
        String s3Key = filePathPrefix.getPrefix() + generateUniqueFilename(file);
        S3FileMetadata entity = S3FileMetadata.builder()
                .originalFilename(file.getOriginalFilename())
                .s3Key(s3Key)
                .size(file.getSize())
                .url("https://" + bucketName + ".s3." + region + ".amazonaws.com/" + s3Key)
                .contentType(file.getContentType())
                .status(FileStatus.PENDING)
                .memberId(Long.parseLong(memberId))
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
        }catch(IOException e){
            throw new InternalServerErrorException();
        }catch(S3Exception e){
            throw e;
        }

        return entity;
    }

//    @Transactional(noRollbackFor = {S3Exception.class} )
    public List<S3FileMetadata> putObjects(List<MultipartFile> files, FilePathPrefix filePathPrefix) {
        // TODO
        // 파일 업로드 하는데 더 좋은 방법이 있나?..

//        UserDetailsImpl principal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
//        String memberId = principal.getMemberId();
        List<S3FileMetadata> s3FileMetadataList = new ArrayList<>();

        try{
            for(MultipartFile file : files){
                String s3Key = filePathPrefix.getPrefix() + generateUniqueFilename(file);
                S3FileMetadata entity = S3FileMetadata.builder()
                        .originalFilename(file.getOriginalFilename())
                        .s3Key(s3Key)
                        .size(file.getSize())
                        .url("https://" + bucketName + ".s3." + region + ".amazonaws.com/" + s3Key)
                        .contentType(file.getContentType())
                        .status(FileStatus.PENDING)
//                        .memberId(Long.parseLong(memberId))
                        .memberId(Long.parseLong("1"))
                        .build();
                s3FileMetadataList.add(entity);
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
                    // 파일 업로드 실패한경우. 기존까지 업로드한거 다 롤백해야한다.
                    entity.setStatus(FileStatus.FAILED);
                    List<Long> list = s3FileMetadataList.stream()
                            .filter(s->s.getStatus()==FileStatus.STORED)
                            .map(S3FileMetadata::getId).toList();
                    deleteObjects(list);
                    throw new FileUploadFailException();
                }
            }
        }catch(IOException e){
            throw new RuntimeException(e.getMessage());
        }catch (S3Exception e){
            throw new S3ConnectionException();
        }finally {
            // TODO bulkInsert
            s3FileMetadataRepository.saveAll(s3FileMetadataList);
        }

        return s3FileMetadataList;
    }


    @Override
    @Transactional(noRollbackFor = S3ConnectionException.class)
    public int deleteObject(Long s3FileMetadataId) {
        UserDetailsImpl principal = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String memberId = principal.getMemberId();
//        String memberId ="1";
        S3FileMetadata s3FileMetadata = s3FileMetadataRepository.findById(s3FileMetadataId).orElseThrow(
                BadRequestException::new);
        // 소유자만 삭제가 가능해야한다.
        if(!s3FileMetadata.getMemberId().equals(Long.parseLong(memberId))){
            throw new RuntimeException("파일 권한없는 사용자");
        }

        try{
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3FileMetadata.getS3Key())
                    .build();
            DeleteObjectResponse deleteObjectResponse = s3Client.deleteObject(deleteObjectRequest);
            if(deleteObjectResponse.sdkHttpResponse().isSuccessful()){
                s3FileMetadata.delete();
            }else{
                throw new S3ConnectionException();
            }
        }catch (S3Exception e){
            throw new S3ConnectionException();
        }
        return 0;
    }

    @Override
    @Transactional(noRollbackFor = S3ConnectionException.class)
    public int deleteObjects(List<Long> s3FileMetadataIdList) {
        //TODO 최적화
        for(Long s3FileMetadataId : s3FileMetadataIdList){
            deleteObject(s3FileMetadataId);
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
            throw new ImageExtensionNotSupportedException();
        }
        return fileExtension;
    }

}