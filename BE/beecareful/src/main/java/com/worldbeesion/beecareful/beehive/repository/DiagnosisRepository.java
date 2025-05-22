package com.worldbeesion.beecareful.beehive.repository;

import com.worldbeesion.beecareful.beehive.model.entity.Diagnosis;
import jdk.jshell.Diag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DiagnosisRepository extends JpaRepository<Diagnosis,Long> {

//    @Query("SELECT d FROM Diagnosis d WHERE d.beehive.id = :beehiveId")
//    List<Diagnosis> findDiagnosesByBeehiveId(Long beehiveId);

    @Query("SELECT d FROM Diagnosis d WHERE d.beehive.id = :beehiveId AND d.createdAt >= :startDate")
    List<Diagnosis> findRecentDiagnosesByBeehiveId(@Param("beehiveId") Long beehiveId,
                                                   @Param("startDate") LocalDateTime startDate);


}
