package com.worldbeesion.beecareful.beehive.repository;


import com.worldbeesion.beecareful.beehive.model.dto.BeehiveDiagnosisProjection;
import com.worldbeesion.beecareful.beehive.model.entity.Beehive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BeehiveRepository extends JpaRepository<Beehive, Long> {

    @Query(value = """
    SELECT b.beehive_id AS beehiveId,
           b.nickname AS nickname,
           b.created_at AS createdAt,
           b.x_direction AS xDirection,
           b.y_direction AS yDirection,
           b.hornet_appeared_at AS hornetAppearedAt,
           b.is_infected AS isInfected,
           d.created_at AS recordCreatedAt,
           d.created_at AS lastDiagnosedAt,
           d.diagnosis_id AS lastDiagnosisId
    FROM beehives b
    LEFT JOIN (
        SELECT d1.*
        FROM diagnoses d1
        INNER JOIN (
            SELECT beehive_id, MAX(created_at) AS max_created
            FROM diagnoses
            GROUP BY beehive_id
        ) d2 ON d1.beehive_id = d2.beehive_id AND d1.created_at = d2.max_created
    ) d ON b.beehive_id = d.beehive_id
    WHERE b.deleted_at IS NULL AND b.apiary_id = :apiaryId
    """, nativeQuery = true)
    List<BeehiveDiagnosisProjection> findAllBeehiveDto(@Param("apiaryId") Long apiaryId);

}

