package com.worldbeesion.beecareful.beehive.model.dto;

import java.time.LocalDateTime;

public record BeehiveDiagnosisInfoDto(
        Long beeHiveId,
        LocalDateTime createdAt,
        Long imagoCount,
        Long larvaCount,
        DiagnosisResultDto diagnosisResultDto
) {
}
