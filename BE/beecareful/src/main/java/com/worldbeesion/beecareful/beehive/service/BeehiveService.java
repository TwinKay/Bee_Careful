package com.worldbeesion.beecareful.beehive.service;

import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;

import java.util.List;

public interface BeehiveService {
    void addBeehive(BeehiveRequestDto beehiveRequestDto, UserDetailsImpl userDetails);

    List<AllBeehiveResponseDto> getAllBeehives(UserDetailsImpl userDetails);

    BeehiveDetailResponseDto getBeehiveDetails(Long beehiveId, int month, UserDetailsImpl userDetails);

    AnnotatedImagesDto getAnnotatedImages(Long beehiveId, Long diagnosisId);

    void addTurret(Long beehiveId, TurretRequestDto turretRequestDto);

    void updateBeehive(Long beehiveId, BeehiveUpdateDto beehiveUpdateDto, UserDetailsImpl userDetails);

    void deleteBeehive(Long beehiveId, UserDetailsImpl userDetails);
}
