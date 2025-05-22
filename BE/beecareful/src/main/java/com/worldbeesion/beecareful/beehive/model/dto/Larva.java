package com.worldbeesion.beecareful.beehive.model.dto;

public record Larva(
        Long varroaCount,
        double varroaRatio,
        Long foulBroodCount,
        double foulBroodRatio,
        Long chalkBroodCount,
        double chalkBroodRatio
) {
}
