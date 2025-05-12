package com.worldbeesion.beecareful.beehive.model.dto;

public interface DiagnosisResultProjection {
    // Larva fields
    Long getLarvavarroaCount();
    double getLarvaarroaRatio();
    Long getLarvafoulBroodCount();
    double getLarvafoulBroodRatio();
    Long getLarvachalkBroodCount();
    double getLarvachalkBroodRatio();

    // Imago fields
    Long getImagovarroaCount();
    double getImagovarroaRatio();
    Long getImagodwvCount();
    double getImagodwvRatio();
}