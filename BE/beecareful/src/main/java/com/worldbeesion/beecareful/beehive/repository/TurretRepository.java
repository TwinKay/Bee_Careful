package com.worldbeesion.beecareful.beehive.repository;

import com.worldbeesion.beecareful.beehive.model.entity.Beehive;
import com.worldbeesion.beecareful.beehive.model.entity.Turret;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TurretRepository extends JpaRepository<Turret, Long> {
    Optional<Turret> findByBeehive(Beehive beehive);
}
