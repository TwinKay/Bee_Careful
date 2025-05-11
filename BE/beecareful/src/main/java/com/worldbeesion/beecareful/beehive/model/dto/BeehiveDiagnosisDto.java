package com.worldbeesion.beecareful.beehive.model.dto;

import java.time.LocalDateTime;

public record BeehiveDiagnosisDto(
        Long beehiveId,
        String nickname,
        LocalDateTime createdAt,
        Long xDirection,
        Long yDirection,
        LocalDateTime hornetAppearedAt,
        Boolean isInfected,
        LocalDateTime recordCreatedAt,
        LocalDateTime lastDiagnosedAt,
        Long lastDiagnosisId
) {
}
