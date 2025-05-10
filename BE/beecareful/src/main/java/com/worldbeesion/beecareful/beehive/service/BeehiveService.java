package com.worldbeesion.beecareful.beehive.service;


import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisRequestDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResponseDto;

import java.util.List;

public interface BeehiveService {
    public List<DiagnosisResponseDto> generateDiagnosisPresignedUrl(DiagnosisDto dto);
}
