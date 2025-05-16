package com.worldbeesion.beecareful.s3.service;

import static com.worldbeesion.beecareful.common.util.FileUtil.*;

import com.worldbeesion.beecareful.common.exception.BadRequestException; // Assuming this exists
import com.worldbeesion.beecareful.s3.constant.FilePathPrefix;
import com.worldbeesion.beecareful.s3.constant.S3FileStatus;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.exception.FileUploadFailException;
import com.worldbeesion.beecareful.s3.exception.S3ConnectionException;
import com.worldbeesion.beecareful.s3.repository.S3FileMetadataRepository;

import java.io.IOException;
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
    // private final String region;
    private final List<String> allowedExtensions;
    private final S3FileMetadataRepository s3FileMetadataRepository;

    // Constructor for explicit dependency injection
    public S3FileServiceImpl(
        @Value("${cloud.aws.s3.bucket}") String bucketName,
        // @Value("${cloud.aws.region.static}") String region,
        S3Client s3Client,
        S3FileMetadataRepository s3FileMetadataRepository) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        // this.region = region;
        // TODO: consider making this configurable
        this.allowedExtensions = Arrays.asList("jpg", "png", "gif", "jpeg", "webp");
        this.s3FileMetadataRepository = s3FileMetadataRepository;
    }

    /**
     * Handles file uploads from MultipartFile (e.g., direct web uploads).
     */
    @Override
    @Transactional(noRollbackFor = {S3Exception.class, FileUploadFailException.class, IOException.class})
    // Keep transaction but don't rollback for S3/IO issues during upload itself
    public S3FileMetadata putObject(MultipartFile file, FilePathPrefix filePathPrefix) {
        if (file == null || file.isEmpty()) {
            log.warn("Attempted to upload an empty or null MultipartFile.");
            throw new BadRequestException();
        }

        String fileExtension = validateFileExtension(file.getOriginalFilename(), allowedExtensions);

        String uniqueFilename = UUID.randomUUID() + "." + fileExtension;
        String s3Key = filePathPrefix.getPrefix() + uniqueFilename;

        // Build metadata entity
        S3FileMetadata entity = S3FileMetadata.builder()
            .originalFilename(file.getOriginalFilename())
            .s3Key(s3Key)
            .size(file.getSize())
            // .url(fileUrl)
            .contentType(file.getContentType()) // Use content type from MultipartFile
            .status(S3FileStatus.PENDING)
            .build();
        s3FileMetadataRepository.save(entity); // Save pending record

        try {
            // Prepare S3 request
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(file.getContentType()) // Use content type from MultipartFile
                .contentLength(file.getSize())
                .build();

            // Upload
            PutObjectResponse response = s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));

            // Check response and update status
            if (response.sdkHttpResponse() != null && response.sdkHttpResponse().isSuccessful()) {
                entity.setStatus(S3FileStatus.STORED);
                log.info("Successfully uploaded file to S3. Key: {}", s3Key);
            }
            else {
                entity.setStatus(S3FileStatus.FAILED);
                log.error("S3 upload failed for key: {}. Response status: {}", s3Key,
                    response.sdkHttpResponse() != null ? response.sdkHttpResponse().statusCode() : "N/A");
                throw new FileUploadFailException();
            }
        } catch (S3Exception e) {
            entity.setStatus(S3FileStatus.FAILED); // Ensure status is FAILED on S3 exception
            log.error("S3Exception during upload for key {}: {}", s3Key, e.getMessage(), e);
            // Rethrow or wrap in a custom exception if needed, consistent with noRollbackFor
            throw e; // Rethrowing S3Exception as per noRollbackFor
        } catch (IOException e) {
            entity.setStatus(S3FileStatus.FAILED); // Ensure status is FAILED on IO exception
            log.error("IOException reading MultipartFile bytes for key {}: {}", s3Key, e.getMessage(), e);
            // TODO: Define a more specific custom exception (e.g., FileReadException)
            // Rethrow or wrap, consistent with noRollbackFor
            throw new RuntimeException("Error reading file data: " + e.getMessage(), e); // Rethrowing RuntimeException as per original code
        } finally {
            // Save the final status (STORED or FAILED)
            s3FileMetadataRepository.save(entity);
        }

        return entity;
    }

    /**
     * Handles file uploads from byte array (e.g., data received from an API call).
     */
    @Override
    @Transactional(noRollbackFor = {S3Exception.class, FileUploadFailException.class})
    // Keep transaction but don't rollback for S3 issues during upload
    public S3FileMetadata putObject(byte[] fileData, String filename, String contentType, FilePathPrefix filePathPrefix) {
        if (fileData == null || fileData.length == 0) {
            log.warn("Attempted to upload empty or null byte array for filename: {}", filename);
            throw new BadRequestException();
        }
        if (filename == null || filename.isBlank()) {
            log.warn("Attempted to upload file data with null or blank filename.");
            throw new BadRequestException();
        }
        if (contentType == null || contentType.isBlank()) {
            log.warn("Attempted to upload file data with null or blank contentType for filename: {}. Defaulting or failing.", filename);
            // Decide whether to default (e.g., to 'application/octet-stream') or throw an error
            throw new BadRequestException();
            // contentType = "application/octet-stream"; // Option: Default content type
        }

        // Validate extension before proceeding
        String fileExtension = validateFileExtension(filename, allowedExtensions);
        // Generate unique filename using the validated extension
        String uniqueFilename = UUID.randomUUID() + "." + fileExtension;
        String s3Key = filePathPrefix.getPrefix() + uniqueFilename;
        // String fileUrl = generateS3Url(s3Key);
        long fileSize = fileData.length;

        // Build metadata entity
        S3FileMetadata entity = S3FileMetadata.builder()
            .originalFilename(filename) // Use the provided filename
            .s3Key(s3Key)
            .size(fileSize)
            // .url(fileUrl)
            .contentType(contentType) // Use the provided content type
            .status(S3FileStatus.PENDING)
            .build();
        s3FileMetadataRepository.save(entity); // Save pending record

        try {
            // Prepare S3 request
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(contentType) // Use the provided content type
                .contentLength(fileSize)
                .build();

            // Upload
            PutObjectResponse response = s3Client.putObject(putObjectRequest, RequestBody.fromBytes(fileData)); // Use byte array directly

            // Check response and update status
            if (response.sdkHttpResponse() != null && response.sdkHttpResponse().isSuccessful()) {
                entity.setStatus(S3FileStatus.STORED);
                log.info("Successfully uploaded byte data to S3. Key: {}", s3Key);
            }
            else {
                entity.setStatus(S3FileStatus.FAILED);
                log.error("S3 upload failed for key: {}. Response status: {}", s3Key,
                    response.sdkHttpResponse() != null ? response.sdkHttpResponse().statusCode() : "N/A");
                throw new FileUploadFailException();
            }
        } catch (S3Exception e) {
            entity.setStatus(S3FileStatus.FAILED); // Ensure status is FAILED on S3 exception
            log.error("S3Exception during upload for key {}: {}", s3Key, e.getMessage(), e);
            // Rethrow or wrap, consistent with noRollbackFor
            throw e; // Rethrowing S3Exception as per noRollbackFor
        }
        // No IOException expected here as we already have the bytes
        finally {
            // Save the final status (STORED or FAILED)
            s3FileMetadataRepository.save(entity);
        }

        return entity;
    }

    /**
     * Deletes an object from S3 and marks the metadata record as removed.
     */
    @Override
    @Transactional(noRollbackFor = S3ConnectionException.class) // Keep original noRollbackFor logic
    public int deleteObject(Long s3FileMetadataId) {
        // Find metadata or throw exception
        S3FileMetadata s3FileMetadata = s3FileMetadataRepository.findById(s3FileMetadataId)
            .orElseThrow(BadRequestException::new); // More specific message

        // Check if already removed (optional, prevents trying to delete again)
        if (s3FileMetadata.getStatus() == S3FileStatus.DELETED) {
            log.warn("Attempted to delete already removed S3 object with key: {}", s3FileMetadata.getS3Key());
            return 0; // Indicate no action needed or taken
        }

        try {
            // Prepare S3 delete request
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(s3FileMetadata.getS3Key())
                .build();

            // Execute delete
            DeleteObjectResponse deleteObjectResponse = s3Client.deleteObject(deleteObjectRequest);

            // Check response and update metadata status
            // Note: Successful delete often returns 204 No Content, check isSuccessful()
            if (deleteObjectResponse.sdkHttpResponse() != null && deleteObjectResponse.sdkHttpResponse().isSuccessful()) {
                s3FileMetadata.remove(); // Call the remove method on the entity
                s3FileMetadataRepository.save(s3FileMetadata); // Explicitly save the updated entity
                log.info("Successfully deleted object from S3 and marked as REMOVED. Key: {}", s3FileMetadata.getS3Key());
                return 1; // Indicate success
            }
            else {
                log.error("S3 delete request failed for key: {}. Response status: {}", s3FileMetadata.getS3Key(),
                    deleteObjectResponse.sdkHttpResponse() != null ? deleteObjectResponse.sdkHttpResponse().statusCode() : "N/A");
                // Throw exception consistent with original logic
                throw new S3ConnectionException();
            }
        } catch (S3Exception e) {
            log.error("S3Exception during delete for key {}: {}", s3FileMetadata.getS3Key(), e.getMessage(), e);
            // Throw exception consistent with original logic and noRollbackFor
            throw new S3ConnectionException();
        }
        // return 0; // Original code returned 0, returning 1 on success seems more informative
    }

}
