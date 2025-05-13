package com.worldbeesion.beecareful.beehive.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record BeehiveDetailResponseDto(
        @JsonProperty("diagnoses")
        List<BeehiveDiagnosisInfoDto> beehiveDiagnosisInfoDto,
        String nickname,
        Long turretId
) {
}