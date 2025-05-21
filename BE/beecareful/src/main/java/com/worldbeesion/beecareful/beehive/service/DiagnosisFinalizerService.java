package com.worldbeesion.beecareful.beehive.service;

import com.worldbeesion.beecareful.beehive.constant.DiagnosisStatus;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResultProjection;
import com.worldbeesion.beecareful.beehive.model.dto.TotalCountImagoLarvaProjection;
import com.worldbeesion.beecareful.beehive.model.entity.AnalyzedPhoto;
import com.worldbeesion.beecareful.beehive.model.entity.Beehive;
import com.worldbeesion.beecareful.beehive.model.entity.Diagnosis;
import com.worldbeesion.beecareful.beehive.repository.AnalyzedPhotoDiseaseRepository;
import com.worldbeesion.beecareful.beehive.repository.AnalyzedPhotoRepository;
import com.worldbeesion.beecareful.beehive.repository.BeehiveRepository;
import com.worldbeesion.beecareful.beehive.repository.DiagnosisRepository;
import com.worldbeesion.beecareful.member.exception.BadRequestException;
import com.worldbeesion.beecareful.member.model.Member;
import com.worldbeesion.beecareful.notification.constant.NotificationType;
import com.worldbeesion.beecareful.notification.model.dto.NotificationRequestDto;
import com.worldbeesion.beecareful.notification.service.FCMService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class DiagnosisFinalizerService {

    private final DiagnosisRepository diagnosisRepository;
    private final AnalyzedPhotoRepository analyzedPhotoRepository;
    private final AnalyzedPhotoDiseaseRepository analyzedPhotoDiseaseRepository;
    private final BeehiveRepository beehiveRepository;
    private final FCMService fcmService;

    /**
     * Finalizes the diagnosis process by updating the beehive status and sending a notification.
     * This method runs in a new transaction to ensure that the updates are committed even if the
     * calling transaction fails.
     *
     * @param diagnosisId The ID of the diagnosis to finalize
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finishDiagnosis(Long diagnosisId) {
        log.info("Finalizing diagnosis process for diagnosisId: {}", diagnosisId);

        // Retrieve Diagnosis entity
        Diagnosis diagnosis = diagnosisRepository.findById(diagnosisId)
            .orElseThrow(() -> {
                log.error("Diagnosis not found for ID: {}", diagnosisId);
                return new BadRequestException();
            });

        // Update Beehive Status
        // if any of the disease detected, update beehive.is_infected to true.
        Beehive beehive = diagnosis.getBeehive();

        // Get IDs of all analyzed photos
        List<Long> analyzedPhotoIds = analyzedPhotoRepository.getAnalyzedPhotosByDiagnosisId(diagnosisId).stream()
            .map(AnalyzedPhoto::getId)
            .toList();
        log.info("Found {} analyzed photos for diagnosisId: {}", analyzedPhotoIds.size(), diagnosisId);

        // Check if any diseases were detected with count > 0
        boolean hasDisease = false;
        List<DiagnosisResultProjection> diagnosisResults =
            analyzedPhotoDiseaseRepository.getDiagnosisResultByAnalyzedPhotoIds(analyzedPhotoIds);

        // Get total counts for Larva and Imago
        TotalCountImagoLarvaProjection totalCounts = analyzedPhotoRepository.getTotalCountByDiagnosis(diagnosisId);
        Long totalLarva = totalCounts.getLarvaCount();
        Long totalImago = totalCounts.getImagoCount();

        // Sum up all disease counts
        Map<String, Long> summedDiseases = new HashMap<>(
            Map.of("larvavarroaCount", 0L, "larvafoulBroodCount", 0L, "larvachalkBroodCount", 0L, "imagovarroaCount", 0L, "imagodwvCount", 0L)
        );

        // Sum up all disease counts
        for (DiagnosisResultProjection result : diagnosisResults) {
            summedDiseases.put("larvavarroaCount", summedDiseases.get("larvavarroaCount") + result.getLarvavarroaCount());
            summedDiseases.put("larvafoulBroodCount", summedDiseases.get("larvafoulBroodCount") + result.getLarvafoulBroodCount());
            summedDiseases.put("larvachalkBroodCount", summedDiseases.get("larvachalkBroodCount") + result.getLarvachalkBroodCount());
            summedDiseases.put("imagovarroaCount", summedDiseases.get("imagovarroaCount") + result.getImagovarroaCount());
            summedDiseases.put("imagodwvCount", summedDiseases.get("imagodwvCount") + result.getImagodwvCount());
        }

        log.info("Summed Result: {}", summedDiseases);

        // Calculate percentages for Larvavarroa and Imagovarroa
        double larvaVarroaPercentage = calculateDiseaseRatio(summedDiseases.get("larvavarroaCount"), totalLarva);
        double imagoVarroaPercentage = calculateDiseaseRatio(summedDiseases.get("imagovarroaCount"), totalImago);

        // Check if percentages are > 5% for varroa diseases or if count > 0 for other diseases
        boolean hasLarvaVarroa = larvaVarroaPercentage > 5.0;
        boolean hasImagoVarroa = imagoVarroaPercentage > 5.0;

        if (hasLarvaVarroa ||
            hasImagoVarroa ||
            summedDiseases.get("larvafoulBroodCount") > 0 ||
            summedDiseases.get("larvachalkBroodCount") > 0 ||
            summedDiseases.get("imagodwvCount") > 0) {
            hasDisease = true;
        }

        beehive.updateIsInfected(hasDisease);
        beehiveRepository.save(beehive);
        log.info("Updated beehive.isInfected to {} for beehiveId: {}", hasDisease, beehive.getId());

        // Notify user
        Member member = beehive.getApiary().getMember();
        fcmService.alertNotificationByFCM(member, new NotificationRequestDto(beehive.getId(), "진단 완료", NotificationType.SUCCESS));

        log.info("Sent Notification for beehiveId: {}", beehive.getId());
    }

    private double calculateDiseaseRatio(Long diseaseCount, Long totalCount) {
        if (totalCount == null || totalCount == 0)
            return 0;
        return (double)diseaseCount / totalCount * 100;
    }
}