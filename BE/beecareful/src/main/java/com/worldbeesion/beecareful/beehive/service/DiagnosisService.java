package com.worldbeesion.beecareful.beehive.service; // Or a more specific service package

import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisApiResponse;

import reactor.core.publisher.Mono; // If the service method itself is to be reactive

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

}
