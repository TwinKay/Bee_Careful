package com.worldbeesion.beecareful.s3.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.worldbeesion.beecareful.beehive.model.entity.Diagnosis;
import com.worldbeesion.beecareful.beehive.model.entity.OriginalPhoto;
import com.worldbeesion.beecareful.beehive.repository.OriginalPhotoRepository;
import com.worldbeesion.beecareful.beehive.service.DiagnosisService;
import com.worldbeesion.beecareful.s3.constant.S3FileStatus;
import com.worldbeesion.beecareful.s3.exception.S3EventProcessingException;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.repository.S3FileMetadataRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

/**
 * Service responsible for processing S3 upload events and managing the related database operations.
 * This service ensures that each operation is executed in its own transaction.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class S3OriginPhotoUploadProcessingService {

    private final S3FileMetadataRepository s3FileMetadataRepository;
    private final OriginalPhotoRepository originalPhotoRepository;
    private final DiagnosisService diagnosisService;

    /**
     * Updates the status of an S3 file metadata to STORED and returns the associated original photo.
     * This method is executed in its own transaction.
     *
     * @param metadata The S3 file metadata to update
     * @return The original photo associated with the metadata
     * @throws S3EventProcessingException if no original photo is found for the metadata
     */
    @Transactional
    public OriginalPhoto updateOriginPhotoFileStatus(S3FileMetadata metadata) {
        OriginalPhoto originalPhoto = originalPhotoRepository.findByS3FileMetadata(metadata);
        if (originalPhoto == null) {
            log.warn("No OriginalPhoto found for S3FileMetadata with key: {}", metadata.getS3Key());
            throw new S3EventProcessingException(); // TODO: implement metadata not found exception
        }
        metadata.setStatus(S3FileStatus.STORED);
        s3FileMetadataRepository.save(metadata); // Save the updated entity
        log.info("Updated status to STORED for Key: {}", metadata.getS3Key());
        return originalPhoto;
    }

    /**
     * Checks if all original photos for a diagnosis have been uploaded and runs the diagnosis if they have.
     * This method is executed in its own transaction.
     *
     * @param originalPhoto The original photo to check
     */
    @Transactional
    public void checkUploadStatusOfOriginPhotosOfTheDiagnosisAndRunDiagnosis(OriginalPhoto originalPhoto) {
        // Get the diagnosis ID
        Diagnosis diagnosis = originalPhoto.getDiagnosis();
        log.info("Found diagnosis ID: {}", diagnosis.getId());

        // Get all original photos for this diagnosis
        List<OriginalPhoto> allPhotosForDiagnosis = originalPhotoRepository.findAllByDiagnosis(diagnosis);
        log.info("Found {} photos for diagnosis ID: {}", allPhotosForDiagnosis.size(), diagnosis.getId());

        // Check if all photos have been uploaded (their S3FileMetadata status is STORED)
        boolean allPhotosUploaded = true;
        for (OriginalPhoto photo : allPhotosForDiagnosis) {
            if (photo.getS3FileMetadata().getStatus() != S3FileStatus.STORED) {
                allPhotosUploaded = false;
                break;
            }
        }

        // TODO: prevent duplicate call with lock or whatever
        if (allPhotosUploaded) {
            log.info("All photos for diagnosis ID: {} have been uploaded. Running diagnosis...", diagnosis.getId());
            diagnosisService.runDiagnosis(diagnosis.getId());
        } else {
            log.info("Not all photos for diagnosis ID: {} have been uploaded yet.", diagnosis.getId());
        }
    }
}