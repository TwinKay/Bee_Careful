package com.worldbeesion.beecareful.beehive.model.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DiagnosisApiResponse {
    private DiagnosisResult diagnosis;
    private byte[] imageData;

    @Getter
    @Builder
    public static class DiagnosisResult {
        private LarvaResult larva;
        private ImagoResult imago;
    }

    @Getter
    @Builder
    public static class LarvaResult {
        private Long normalCount;
        private Long varroaCount;
        private Long foulBroodCount;
        private Long chalkBroodCount;
    }

    @Getter
    @Builder
    public static class ImagoResult {
        private Long normalCount;
        private Long varroaCount;
        private Long dwvCount;
    }
}