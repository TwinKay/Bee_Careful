package com.worldbeesion.beecareful.beehive.repository;

import com.worldbeesion.beecareful.beehive.model.dto.OriginalPhotoStatusDto;
import com.worldbeesion.beecareful.beehive.model.entity.Diagnosis;
import com.worldbeesion.beecareful.beehive.model.entity.OriginalPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OriginalPhotoRepository extends JpaRepository<OriginalPhoto,Long> {

    @Query("""
        SELECT new com.worldbeesion.beecareful.beehive.model.dto.OriginalPhotoStatusDto(
            op.diagnosis.id,
            op.status
        )
        FROM OriginalPhoto op
        WHERE op.diagnosis.id IN :diagnosisIds
""")
    List<OriginalPhotoStatusDto> findStatusesByDiagnosisIds(@Param("diagnosisIds") List<Long> diagnosisIds);

    List<OriginalPhoto> findAllByDiagnosisId(Long diagnosisId);

    OriginalPhoto findByS3FileMetadata_Id(Long s3FileMetadataId);
}
