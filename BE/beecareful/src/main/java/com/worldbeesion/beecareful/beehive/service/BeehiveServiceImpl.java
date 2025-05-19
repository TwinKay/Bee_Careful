package com.worldbeesion.beecareful.beehive.service;

import com.worldbeesion.beecareful.beehive.exception.AlreadyExistTurretSerialNumException;
import com.worldbeesion.beecareful.beehive.exception.BeehiveNotFoundException;
import com.worldbeesion.beecareful.beehive.exception.DirectionDuplicateException;
import com.worldbeesion.beecareful.beehive.exception.DirectionNullException;
import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.beehive.model.entity.*;
import com.worldbeesion.beecareful.beehive.repository.*;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.member.exception.MemberNotFoundException;
import com.worldbeesion.beecareful.member.model.Members;
import com.worldbeesion.beecareful.member.repository.MembersRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BeehiveServiceImpl implements BeehiveService {

    private final DiagnosisService diagnosisService;
    private final BeehiveRepository beehiveRepository;
    private final DiagnosisRepository diagnosisRepository;
    private final ApiaryRepository apiaryRepository;
    private final MembersRepository membersRepository;
    private final AnalyzedPhotoRepository analyzedPhotoRepository;
    private final AnalyzedPhotoDiseaseRepository analyzedPhotoDiseaseRepository;
    private final TurretRepository turretRepository;

    @Override
    @Transactional
    public void addBeehive(BeehiveRequestDto beehiveRequestDto, UserDetailsImpl userDetails) {
        String nickname = beehiveRequestDto.nickname();
        Long xDirection = beehiveRequestDto.xDirection();
        Long yDirection = beehiveRequestDto.yDirection();

        Long memberId = userDetails.getMemberId();
        Members members = membersRepository.findById(memberId)
            .orElseThrow(MemberNotFoundException::new);

        Apiary apiary = apiaryRepository.findByMembers(members);

        Beehive beehive = Beehive.builder()
            .apiary(apiary)
            .nickname(nickname)
            .xDirection(xDirection)
            .yDirection(yDirection)
            .isInfected(false)
            .build();

        beehiveRepository.save(beehive);
        log.info("Added new beehive '{}' with ID: {} for member ID: {}", nickname, beehive.getId(), memberId);
    }

    @Override
    public List<AllBeehiveResponseDto> getAllBeehives(UserDetailsImpl userDetails) {
        Long memberId = userDetails.getMemberId();
        Members members = membersRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
        Apiary apiary = apiaryRepository.findByMembers(members);

        List<BeehiveDiagnosisProjection> beehiveList = beehiveRepository.findAllBeehiveDto(apiary.getId());

        List<Long> diagnosisIds = beehiveList.stream()
            .map(BeehiveDiagnosisProjection::getLastDiagnosisId)
            .filter(Objects::nonNull)
            .toList();

        Map<Long, Long> statusMap = diagnosisService.getStatusesOfDiagnoses(diagnosisIds);

        return beehiveList.stream()
            .map(dto -> new AllBeehiveResponseDto(
                dto.getBeehiveId(),
                dto.getNickname(),
                dto.getCreatedAt(),
                dto.getXDirection(),
                dto.getYDirection(),
                dto.getHornetAppearedAt(),
                dto.getIsInfected(),
                dto.getRecordCreatedAt(),
                dto.getLastDiagnosedAt(),
                dto.getLastDiagnosisId(),
                statusMap.get(dto.getLastDiagnosisId())
            ))
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BeehiveDetailResponseDto getBeehiveDetails(Long beehiveId, int month, UserDetailsImpl userDetails) {
        Beehive beehive = beehiveRepository.findById(beehiveId).orElse(null);
        if (beehive == null || beehive.getDeletedAt() != null) {
            throw new BeehiveNotFoundException();
        }

        Members members = membersRepository.findById(userDetails.getMemberId()).orElseThrow(MemberNotFoundException::new);
        Apiary apiary = apiaryRepository.findByMembers(members);
        boolean isExist = beehiveRepository.existsByIdAndApiary(beehiveId, apiary);

        if (!isExist) {
            throw new BeehiveNotFoundException();
        }

        LocalDateTime startDate = LocalDateTime.now().minusMonths(month);
        List<Diagnosis> diagnosisList = diagnosisRepository.findRecentDiagnosesByBeehiveId(beehiveId, startDate);

        List<Long> diagnosisIds = new ArrayList<>();
        for (Diagnosis diagnosis : diagnosisList) {
            diagnosisIds.add(diagnosis.getId());
        }

        List<AnalyzedPhotoResultDto> analyzedPhotoIds = analyzedPhotoRepository.getAnalyzedPhotosByDiagnosisIdIn(diagnosisIds);

        List<Long> analyzedPhotoIdList = new ArrayList<>();
        for (AnalyzedPhotoResultDto analyzedPhotoResultDto : analyzedPhotoIds) {
            analyzedPhotoIdList.add(analyzedPhotoResultDto.analyzedPhotoId());
        }

        List<DiagnosisResultProjection> diagnosisResultList = analyzedPhotoDiseaseRepository.getDiagnosisResultByAnalyzedPhotoIds(
            analyzedPhotoIdList);

        List<BeehiveDiagnosisInfoDto> beehiveDiagnosisInfoList = new ArrayList<>();

        for (DiagnosisResultProjection diagnosisResultProjection : diagnosisResultList) {
            TotalCountImagoLarvaProjection totalCountByDiagnosis = analyzedPhotoRepository.getTotalCountByDiagnosis(
                diagnosisResultProjection.getDiagnosisId());
            Long totalLarva = totalCountByDiagnosis.getLarvaCount();
            Long totalImago = totalCountByDiagnosis.getImagoCount();

            double larvaVarroaRatio = calculateDiseaseRatio(diagnosisResultProjection.getLarvavarroaCount(), totalLarva);
            double larvaFoulBroodRatio = calculateDiseaseRatio(diagnosisResultProjection.getLarvafoulBroodCount(), totalLarva);
            double larvaChalkBroodRatio = calculateDiseaseRatio(diagnosisResultProjection.getLarvachalkBroodCount(), totalLarva);
            double imagoVarroaRatio = calculateDiseaseRatio(diagnosisResultProjection.getImagovarroaCount(), totalImago);
            double imagoDwvRatio = calculateDiseaseRatio(diagnosisResultProjection.getImagodwvCount(), totalImago);

            Larva larva = new Larva(
                diagnosisResultProjection.getLarvavarroaCount(),
                larvaVarroaRatio,
                diagnosisResultProjection.getLarvafoulBroodCount(),
                larvaFoulBroodRatio,
                diagnosisResultProjection.getLarvachalkBroodCount(),
                larvaChalkBroodRatio
            );

            Imago imago = new Imago(
                diagnosisResultProjection.getImagovarroaCount(),
                imagoVarroaRatio,
                diagnosisResultProjection.getImagodwvCount(),
                imagoDwvRatio
            );

            DiagnosisResultDto diagnosisResultDto = new DiagnosisResultDto(larva, imago);

            BeehiveDiagnosisInfoDto beehiveDiagnosisInfoDto = new BeehiveDiagnosisInfoDto(
                diagnosisResultProjection.getDiagnosisId(),
                diagnosisResultProjection.getCreatedAt(),
                totalImago,
                totalLarva,
                diagnosisResultDto
            );

            beehiveDiagnosisInfoList.add(beehiveDiagnosisInfoDto);
        }

        Turret turret = turretRepository.findByBeehive(beehive).orElse(null);
        Long turretId = null;
        if (turret != null) {
            turretId = turret.getId();
        }

        return new BeehiveDetailResponseDto(
            beehiveDiagnosisInfoList,
            beehive.getNickname(),
            turretId
        );
    }

    @Override
    @Transactional
    public void addTurret(Long beehiveId, TurretRequestDto turretRequestDto) {
        Beehive beehive = beehiveRepository.findById(beehiveId).orElseThrow(BeehiveNotFoundException::new);

        boolean alreadyExist = turretRepository.existsTurretBySerial(turretRequestDto.serial().trim());

        if(alreadyExist) {
            throw new AlreadyExistTurretSerialNumException();
        }

        Turret turret = turretRepository.findByBeehive(beehive).orElse(null);

        if (turret != null) {
            turret.updateTurret(turretRequestDto.serial());
            return;
        }

        Turret newTurret = Turret.builder()
            .beehive(beehive)
            .serial(turretRequestDto.serial())
            .build();

        turretRepository.save(newTurret);
    }

    @Override
    @Transactional
    public void updateBeehive(Long beehiveId, BeehiveUpdateDto beehiveUpdateDto, UserDetailsImpl userDetails) {
        Beehive beehive = beehiveRepository.findById(beehiveId).orElseThrow(BeehiveNotFoundException::new);

        if (beehiveUpdateDto.xDirection() == null || beehiveUpdateDto.yDirection() == null) {
            throw new DirectionNullException();
        }

        Members members = membersRepository.findById(userDetails.getMemberId()).orElseThrow(MemberNotFoundException::new);
        Apiary apiary = apiaryRepository.findByMembers(members);

        boolean isLocated = beehiveRepository.existsByApiaryAndDirection(
                apiary,
                beehiveUpdateDto.xDirection(),
                beehiveUpdateDto.yDirection(),
                beehiveId
        );

        if (isLocated) {
            throw new DirectionDuplicateException();
        }

        beehive.updateNickname(beehiveUpdateDto.nickname());
        beehive.updateDirection(beehiveUpdateDto.xDirection(), beehiveUpdateDto.yDirection());
    }

    @Override
    @Transactional
    public void deleteBeehive(Long beehiveId, UserDetailsImpl userDetails) {
        Beehive beehive = beehiveRepository.findById(beehiveId).orElse(null);
        if (beehive == null || beehive.getDeletedAt() != null) {
            throw new BeehiveNotFoundException();
        }

        Members members = membersRepository.findById(userDetails.getMemberId()).orElseThrow(MemberNotFoundException::new);
        Apiary apiary = apiaryRepository.findByMembers(members);
        boolean isExist = beehiveRepository.existsByIdAndApiary(beehiveId, apiary);

        if (!isExist) {
            throw new BeehiveNotFoundException();
        }

        beehive.delete();

    }

    private double calculateDiseaseRatio(Long diseaseCount, Long totalCount) {
        if (totalCount == 0)
            return 0;
        return (double)diseaseCount / totalCount * 100;
    }
}
