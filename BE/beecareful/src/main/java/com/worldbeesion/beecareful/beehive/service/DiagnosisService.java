package com.worldbeesion.beecareful.beehive.service;

import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisApiResponse;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResponseDto;
import com.worldbeesion.beecareful.beehive.model.entity.AnalyzedPhoto;
import com.worldbeesion.beecareful.beehive.model.entity.Diagnosis;
import com.worldbeesion.beecareful.beehive.model.entity.OriginalPhoto;
import com.worldbeesion.beecareful.beehive.constant.BeeStage;
import com.worldbeesion.beecareful.beehive.constant.DiseaseName;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;

import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface DiagnosisService {

    /**
     * Analyzes a photo by calling an external AI API.
     *
     * @param originalPhotoS3Key The S3 key of the original photo to be analyzed.
     * @return A Mono emitting DiagnosisApiResponse containing the diagnosis result and S3 key of the analyzed image.
     * The Mono will complete exceptionally if the API call or parsing fails.
     * Note: The actual implementation might block internally to produce this Mono
     * if it uses synchronous components for parsing/data extraction after the WebClient call.
     */
    Mono<DiagnosisApiResponse> analyzePhoto(String originalPhotoS3Key);

    /**
     * Runs the diagnosis process for a given diagnosis ID.
     * 
     * @param diagnosisId The ID of the diagnosis to run
     */
    void runDiagnosis(Long diagnosisId);

    /**
     * Creates an AnalyzedPhoto entity from the diagnosis result.
     * 
     * @param originalPhoto The original photo entity
     * @param diagnosis The diagnosis entity
     * @param analyzedImageMetadata The S3 file metadata for the analyzed image
     * @param diagResult The diagnosis result from the AI API
     * @return The created AnalyzedPhoto entity
     */
    AnalyzedPhoto createAnalyzedPhotoEntity(
        OriginalPhoto originalPhoto,
        Diagnosis diagnosis,
        S3FileMetadata analyzedImageMetadata,
        DiagnosisApiResponse.DiagnosisResult diagResult
    );

    /**
     * Saves all detected diseases for a given analyzed photo.
     * 
     * @param analyzedPhoto The analyzed photo entity
     * @param result The diagnosis result from the AI API
     */
    void saveAnalyzedPhotoDiseases(AnalyzedPhoto analyzedPhoto, DiagnosisApiResponse.DiagnosisResult result);

    /**
     * Saves a disease detection for an analyzed photo.
     * 
     * @param analyzedPhoto The analyzed photo entity
     * @param beeStage The stage of the bee (larva or imago)
     * @param diseaseName The name of the disease
     * @param count The count of the disease
     */
    void saveAnalyzedPhotoDisease(AnalyzedPhoto analyzedPhoto, BeeStage beeStage, DiseaseName diseaseName, Long count);

    /**
     * Sums up all the diagnosis results from multiple photos.
     * 
     * @param diagnosisResults List of diagnosis results to sum up
     * @return A single DiagnosisResult containing the summed up values
     */
    DiagnosisApiResponse.DiagnosisResult sumUpDiagnosisResults(List<DiagnosisApiResponse.DiagnosisResult> diagnosisResults);

    /**
     * Gets the status of each beehive based on the diagnosis IDs.
     * 
     * @param diagnosisIds List of diagnosis IDs
     * @return Map of diagnosis ID to status
     */
    Map<Long, Long> getStatusesOfDiagnoses(List<Long> diagnosisIds);

    /**
     * Calculates the status of each diagnosis based on the status of its original photos.
     * 
     * @param group Map of diagnosis ID to list of diagnosis statuses
     * @return Map of diagnosis ID to status
     */
    Map<Long, Long> calculateStatus(Map<Long, List<DiagnosisStatus>> group);

    /**
     * Generates presigned URLs for uploading diagnosis photos.
     * 
     * @param dto The diagnosis DTO containing beehive ID and photos
     * @return List of diagnosis response DTOs containing presigned URLs
     */
    List<DiagnosisResponseDto> generateDiagnosisPresignedUrls(DiagnosisDto dto);
}
