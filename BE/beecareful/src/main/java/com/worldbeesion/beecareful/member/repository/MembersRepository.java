package com.worldbeesion.beecareful.member.repository;

import com.worldbeesion.beecareful.member.model.Members;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MembersRepository extends JpaRepository<Members, Long> {
}
