package com.worldbeesion.beecareful.beehive.model.dto;

public record AnalyzedPhotoImageDto(
    DiagnosisApiResponse.DiagnosisResult diagnosisResult,
    byte[] analyzedImageData,
    String imageContentType
) {
}
