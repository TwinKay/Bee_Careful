package com.worldbeesion.beecareful.beehive.model.dto;

import lombok.Builder;

@Builder
public record DiagnosisResponseDto(
        String filename,
        Integer status,
        String preSignedUrl
){
}
