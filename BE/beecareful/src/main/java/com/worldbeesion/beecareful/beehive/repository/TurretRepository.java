package com.worldbeesion.beecareful.beehive.repository;

import com.worldbeesion.beecareful.beehive.model.entity.Beehive;
import com.worldbeesion.beecareful.beehive.model.entity.Turret;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TurretRepository extends JpaRepository<Turret, Long> {
    Optional<Turret> findByBeehive(Beehive beehive);

    @Query("""
       SELECT COUNT(t) > 0
       FROM Turret t
       WHERE t.serial = :serial
""")
    boolean existsTurretBySerial(@Param("serial") String serial);

    Optional<Turret> findBySerial(String serial);

    @Query("SELECT t.beehive FROM Turret t WHERE t.id = :turretId")
    Optional<Beehive> findBeehiveByTurretId(@Param("turretId") Long turretId);

    void deleteByBeehive(Beehive beehive);
}
