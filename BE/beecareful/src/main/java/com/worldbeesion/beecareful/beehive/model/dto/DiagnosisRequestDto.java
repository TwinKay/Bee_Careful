package com.worldbeesion.beecareful.beehive.model.dto;

import java.util.List;

public record DiagnosisRequestDto(
        Long count,
        List<Photo> photos
)
{}
