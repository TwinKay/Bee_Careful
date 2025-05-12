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
//    @Query("""
//        SELECT new com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResultDto(
//            new com.worldbeesion.beecareful.beehive.model.dto.Larva(
//                SUM(CASE WHEN disease.name = 'VARROA' THEN apd.count ELSE 0 END) AS varroaCount,
//                SUM(CASE WHEN disease.name = 'VARROA' THEN apd.count ELSE 0 END) * 100.0 / SUM(ap.larvaCount) AS varroaRatio,
//                SUM(CASE WHEN disease.name = 'FOUL_BROOD' THEN apd.count ELSE 0 END) AS foulBroodCount,
//                SUM(CASE WHEN disease.name = 'FOUL_BROOD' THEN apd.count ELSE 0 END) * 100.0 / SUM(ap.larvaCount) AS foulBroodRatio,
//                SUM(CASE WHEN disease.name = 'CHALK_BROOD' THEN apd.count ELSE 0 END) AS chalkBroodCount,
//                SUM(CASE WHEN disease.name = 'CHALK_BROOD' THEN apd.count ELSE 0 END) * 100.0 / SUM(ap.larvaCount) AS chalkBroodRatio
//            ) AS larva,
//            new com.worldbeesion.beecareful.beehive.model.dto.Imago(
//                SUM(CASE WHEN disease.name = 'VARROA' THEN apd.count ELSE 0 END) AS varroaCount,
//                (SUM(CASE WHEN disease.name = 'VARROA' THEN apd.count ELSE 0 END) * 100.0 / SUM(ap.imagoCount)) AS varroaRatio,
//                SUM(CASE WHEN disease.name = 'DWV' THEN apd.count ELSE 0 END) AS dwvCount,
//                (SUM(CASE WHEN disease.name = 'DWV' THEN apd.count ELSE 0 END) * 100.0 / SUM(ap.imagoCount)) AS dwvRatio,
//            ) AS imago
//        )
//        FROM AnalyzedPhoto ap
//        JOIN ap.analyzedPhotoDiseases apd
//        JOIN apd.disease disease
//        WHERE ap.id IN :analyzedPhotoIds
//    """)

    @Query("""
    SELECT new com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResultProjection(
        SUM(CASE WHEN disease.name = 'VARROA' THEN apd.count ELSE 0 END),
        SUM(CASE WHEN disease.name = 'VARROA' THEN apd.count ELSE 0 END) * 100.0 / SUM(ap.larvaCount),
        SUM(CASE WHEN disease.name = 'FOUL_BROOD' THEN apd.count ELSE 0 END),
        SUM(CASE WHEN disease.name = 'FOUL_BROOD' THEN apd.count ELSE 0 END) * 100.0 / SUM(ap.larvaCount),
        SUM(CASE WHEN disease.name = 'CHALK_BROOD' THEN apd.count ELSE 0 END),
        SUM(CASE WHEN disease.name = 'CHALK_BROOD' THEN apd.count ELSE 0 END) * 100.0 / SUM(ap.larvaCount),
        
        SUM(CASE WHEN disease.name = 'VARROA' THEN apd.count ELSE 0 END),
        SUM(CASE WHEN disease.name = 'VARROA' THEN apd.count ELSE 0 END) * 100.0 / SUM(ap.imagoCount),
        SUM(CASE WHEN disease.name = 'DWV' THEN apd.count ELSE 0 END),
        SUM(CASE WHEN disease.name = 'DWV' THEN apd.count ELSE 0 END) * 100.0 / SUM(ap.imagoCount)
    )
    FROM AnalyzedPhoto ap
    JOIN ap.analyzedPhotoDiseases apd
    JOIN apd.disease disease
    WHERE ap.id IN :analyzedPhotoIds
    GROUP BY ap.id
""")
    List<DiagnosisResultProjection> getDiagnosisResultByAnalyzedPhotoIds(List<Long> analyzedPhotoIds);
    DiagnosisResultDto findDiagnosisResultByAnalyzedPhotoIds(@Param("analyzedPhotoIds") List<Long> analyzedPhotoIds);
}


