package com.worldbeesion.beecareful.beehive.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.worldbeesion.beecareful.beehive.constant.BeeStage;
import com.worldbeesion.beecareful.beehive.constant.DiseaseName;
import com.worldbeesion.beecareful.beehive.model.entity.Disease;

public interface DiseaseRepository extends JpaRepository<Disease, Long>  {
	Disease findByNameAndStage(DiseaseName name, BeeStage stage);
}
