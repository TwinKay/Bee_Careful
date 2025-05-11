package com.worldbeesion.beecareful.beehive.service;


import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;
import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;

import java.util.List;
import java.util.Map;

public interface BeehiveService {
    List<DiagnosisResponseDto> generateDiagnosisPresignedUrl(DiagnosisDto dto);
    void addBeehive(BeehiveRequestDto beehiveRequestDto,UserDetailsImpl userDetails);
    List<AllBeehiveResponseDto> getAllBeehives();
    Map<Long, Long> getStatusEachBeehive(List<Long> diagnosisIds);
    Map<Long, Long> calculateStatus(Map<Long, List<DiagnosisStatus>> group);
}
