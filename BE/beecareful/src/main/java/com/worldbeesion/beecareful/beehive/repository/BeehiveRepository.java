package com.worldbeesion.beecareful.beehive.repository;


import com.worldbeesion.beecareful.beehive.model.entity.Beehive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BeehiveRepository extends JpaRepository<Beehive,Long> {
}
