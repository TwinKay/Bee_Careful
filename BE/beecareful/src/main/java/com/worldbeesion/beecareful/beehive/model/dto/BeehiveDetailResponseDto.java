package com.worldbeesion.beecareful.beehive.model.dto;

import java.util.List;

public record BeehiveDetailResponseDto(
        List<BeehiveDiagnosisInfoDto> beehiveDiagnosisInfoDto,
        PageInfoDto pageInfoDto,
        String nickname,
        Long turretId
) {
}