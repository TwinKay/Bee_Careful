package com.worldbeesion.beecareful.beehive.model.dto;

import java.util.List;

public record DiagnosisDto(
        Long beeHiveId,
        List<Photo> photos
)
{}
