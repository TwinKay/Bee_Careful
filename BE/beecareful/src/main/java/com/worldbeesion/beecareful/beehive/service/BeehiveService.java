package com.worldbeesion.beecareful.beehive.service;


import com.worldbeesion.beecareful.beehive.model.dto.BeehiveRequestDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisRequestDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResponseDto;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;

import java.util.List;

public interface BeehiveService {
    List<DiagnosisResponseDto> generateDiagnosisPresignedUrl(DiagnosisDto dto);
    void addBeehive(BeehiveRequestDto beehiveRequestDto,UserDetailsImpl userDetails);
}
