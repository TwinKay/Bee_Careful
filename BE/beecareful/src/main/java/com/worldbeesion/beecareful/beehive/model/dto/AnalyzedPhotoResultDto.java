package com.worldbeesion.beecareful.beehive.model.dto;

public record AnalyzedPhotoResultDto(
        Long diagnosisId,
        Long analyzedPhotoId,
        Long larvaCount,
        Long ImagoCount
) {
}
