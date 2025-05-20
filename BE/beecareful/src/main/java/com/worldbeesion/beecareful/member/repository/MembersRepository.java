package com.worldbeesion.beecareful.member.repository;

import com.worldbeesion.beecareful.member.model.Member;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MembersRepository extends JpaRepository<Member, Long> {
}
