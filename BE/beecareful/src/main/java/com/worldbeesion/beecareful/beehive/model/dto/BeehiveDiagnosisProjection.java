package com.worldbeesion.beecareful.beehive.model.dto;

import java.time.LocalDateTime;

public interface BeehiveDiagnosisProjection {
    Long getBeehiveId();
    String getNickname();
    LocalDateTime getCreatedAt();
    Long getXDirection();
    Long getYDirection();
    LocalDateTime getHornetAppearedAt();
    Boolean getIsInfected();
    LocalDateTime getRecordCreatedAt();
    LocalDateTime getLastDiagnosedAt();
    Long getLastDiagnosisId();
}

