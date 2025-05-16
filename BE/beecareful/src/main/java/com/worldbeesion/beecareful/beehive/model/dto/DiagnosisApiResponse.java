package com.worldbeesion.beecareful.beehive.model.dto;

import lombok.Builder;

@Builder
public record DiagnosisApiResponse(DiagnosisResult diagnosis, String analyzedImageS3Key) {

    @Builder
    public record DiagnosisResult(LarvaResult larva, ImagoResult imago) {
    }

    @Builder
    public record LarvaResult(Long normalCount, Long varroaCount, Long foulBroodCount, Long chalkBroodCount) {
    }

    @Builder
    public record ImagoResult(Long normalCount, Long varroaCount, Long dwvCount) {
    }
}
