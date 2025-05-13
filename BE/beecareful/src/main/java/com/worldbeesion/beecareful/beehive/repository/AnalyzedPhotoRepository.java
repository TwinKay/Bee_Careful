package com.worldbeesion.beecareful.beehive.repository;

import com.worldbeesion.beecareful.beehive.model.dto.AnalyzedPhotoResultDto;
import com.worldbeesion.beecareful.beehive.model.dto.TotalCountImagoLarvaProjection;
import com.worldbeesion.beecareful.beehive.model.entity.AnalyzedPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalyzedPhotoRepository extends JpaRepository<AnalyzedPhoto, Long> {

    @Query("""
        SELECT new com.worldbeesion.beecareful.beehive.model.dto.AnalyzedPhotoResultDto(
                    ap.diagnosis.id, ap.id, ap.imagoCount, ap.larvaCount
                )
        FROM AnalyzedPhoto ap
        WHERE ap.diagnosis.id IN :diagnosisIds
        """)
    List<AnalyzedPhotoResultDto> getAnalyzedPhotosByDiagnosisIdIn(@Param("diagnosisIds") List<Long> diagnosisIds);


    @Query("""
    SELECT
        SUM(ap.imagoCount) AS imagoCount,
        SUM(ap.larvaCount) AS larvaCount
    FROM AnalyzedPhoto ap
    WHERE ap.diagnosis.id = :diagnosisId
""")
    TotalCountImagoLarvaProjection getTotalCountByDiagnosis(@Param("diagnosisId") Long diagnosisId);
}
