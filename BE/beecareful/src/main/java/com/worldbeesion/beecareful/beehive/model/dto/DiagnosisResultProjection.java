package com.worldbeesion.beecareful.beehive.model.dto;


import java.time.LocalDateTime;

public interface DiagnosisResultProjection {
    // 진단 ID
    Long getDiagnosisId();
    LocalDateTime getCreatedAt();
    // Larva fields
    Long getLarvavarroaCount();
    Long getLarvafoulBroodCount();
    Long getLarvachalkBroodCount();

    // Imago fields
    Long getImagovarroaCount();
    Long getImagodwvCount();
}
