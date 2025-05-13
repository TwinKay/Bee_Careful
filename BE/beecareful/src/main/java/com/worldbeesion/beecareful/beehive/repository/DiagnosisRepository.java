package com.worldbeesion.beecareful.beehive.repository;

import com.worldbeesion.beecareful.beehive.model.entity.Diagnosis;
import jdk.jshell.Diag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DiagnosisRepository extends JpaRepository<Diagnosis,Long> {

    @Query("SELECT d FROM Diagnosis d WHERE d.beehive.id = :beehiveId")
    Page<Diagnosis> findDiagnosesByBeehiveId(Long beehiveId, Pageable pageable);



}
