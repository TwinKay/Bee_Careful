package com.worldbeesion.beecareful.beehive.model.dto;

import java.time.LocalDateTime;

public record BeehiveDiagnosisInfoDto(
        Long diagnosisId,
        LocalDateTime createdAt,
        Long imagoCount,
        Long larvaCount,
        DiagnosisResultDto diagnosisResultDto
) {
}
