package com.worldbeesion.beecareful.beehive.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public record BeehiveDiagnosisInfoDto(
        Long diagnosisId,
        LocalDateTime createdAt,
        Long imagoCount,
        Long larvaCount,

        @JsonProperty("result")
        DiagnosisResultDto diagnosisResultDto
) {
}
