package com.worldbeesion.beecareful.beehive.service;


import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;
import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface BeehiveService {
    List<DiagnosisResponseDto> generateDiagnosisPresignedUrl(DiagnosisDto dto);
    void addBeehive(BeehiveRequestDto beehiveRequestDto,UserDetailsImpl userDetails);
    List<AllBeehiveResponseDto> getAllBeehives(UserDetailsImpl userDetails);
    BeehiveDetailResponseDto getBeehiveDetails(Long beehiveId, Pageable pageable);
    void addTurret(Long beehiveId, TurretRequestDto turretRequestDto);
}
