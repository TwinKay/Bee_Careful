package com.worldbeesion.beecareful.beehive.repository;

import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResultDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResultProjection;
import com.worldbeesion.beecareful.beehive.model.entity.AnalyzedPhotoDisease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalyzedPhotoDiseaseRepository extends JpaRepository<AnalyzedPhotoDisease, Long> {

    @Query("""
    SELECT
        ap.diagnosis.id AS diagnosisId,
        ap.diagnosis.createdAt AS createdAt,
        SUM(CASE WHEN disease.name = 'VARROA' and disease.stage = 'LARVA' THEN apd.count ELSE 0 END) AS larvavarroaCount,
        SUM(CASE WHEN disease.name = 'FOULBROOD' and disease.stage = 'LARVA' THEN apd.count ELSE 0 END) AS larvafoulBroodCount,
        SUM(CASE WHEN disease.name = 'CHALKBROOD' and disease.stage = 'LARVA' THEN apd.count ELSE 0 END) AS larvachalkBroodCount,
        SUM(CASE WHEN disease.name = 'VARROA' and disease.stage = 'IMAGO' THEN apd.count ELSE 0 END) AS imagovarroaCount,
        SUM(CASE WHEN disease.name = 'DWV' and disease.stage = 'IMAGO' THEN apd.count ELSE 0 END) AS imagodwvCount
    FROM AnalyzedPhotoDisease apd
    JOIN apd.analyzedPhoto ap
    JOIN apd.disease disease
    WHERE ap.id IN :analyzedPhotoIds
    GROUP BY ap.diagnosis.id, ap.diagnosis.createdAt
""")
    List<DiagnosisResultProjection> getDiagnosisResultByAnalyzedPhotoIds(@Param("analyzedPhotoIds") List<Long> analyzedPhotoIds);


}


