package com.worldbeesion.beecareful.beehive.service; // Or a more specific service package

import com.worldbeesion.beecareful.beehive.model.dto.AnalyzedPhotoImageDto;

import reactor.core.publisher.Mono; // If the service method itself is to be reactive

public interface AiDiagnosisService {

    /**
     * Analyzes a photo by calling an external AI API.
     *
     * @param originalPhotoS3Url The S3 URL of the original photo to be analyzed.
     * @return A Mono emitting AiAnalysisData containing the diagnosis result and analyzed image data.
     * The Mono will complete exceptionally if the API call or parsing fails.
     * Note: The actual implementation might block internally to produce this Mono
     * if it uses synchronous components for parsing/data extraction after the WebClient call.
     */
    Mono<AnalyzedPhotoImageDto> analyzePhoto(String originalPhotoS3Url);

}
