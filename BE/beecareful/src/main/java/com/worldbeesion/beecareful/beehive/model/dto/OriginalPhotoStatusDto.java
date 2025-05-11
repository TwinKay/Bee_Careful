package com.worldbeesion.beecareful.beehive.model.dto;

import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;

public record OriginalPhotoStatusDto(
        Long diagnosisId,
        DiagnosisStatus status
) {
}
