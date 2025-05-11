package com.worldbeesion.beecareful.beehive.model.dto;

public record DiagnosisResultDto(
        Larva larva,
        Imago imago
) {
    public record Larva (
            int varroaCount,
            double varroaRatio,
            int foulBroodCount,
            double foulBroodRatio,
            int chalkBroodCount,
            double chalkBroodRatio
    ) {}

    public record Imago (
            int varroaCount,
            double varroaRatio,
            int dwvCount,
            double dwvRatio
    ) {}
}
