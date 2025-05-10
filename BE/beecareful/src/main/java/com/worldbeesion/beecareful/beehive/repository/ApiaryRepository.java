package com.worldbeesion.beecareful.beehive.repository;

import com.worldbeesion.beecareful.beehive.model.entity.Apiary;
import com.worldbeesion.beecareful.member.model.Members;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApiaryRepository extends JpaRepository<Apiary, Long> {
    Apiary findByMembers(Members members);
}
