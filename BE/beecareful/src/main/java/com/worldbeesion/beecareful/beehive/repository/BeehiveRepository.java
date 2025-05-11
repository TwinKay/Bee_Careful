package com.worldbeesion.beecareful.beehive.repository;


import com.worldbeesion.beecareful.beehive.model.dto.BeehiveDiagnosisDto;
import com.worldbeesion.beecareful.beehive.model.entity.Beehive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BeehiveRepository extends JpaRepository<Beehive, Long> {

    @Query(value = """
        SELECT b.beehive_id,
               b.nickname,
               b.created_at,
               b.x_direction,
               b.y_direction,
               b.hornet_appeared_at,
               b.is_infected,
               d.created_at,
               d.created_at,
               d.diagnosis_id
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
    List<Object[]> findAllBeehiveDto(@Param("apiaryId") Long apiaryId);
}

