package com.worldbeesion.beecareful.member.repository;

import com.worldbeesion.beecareful.member.model.AuthMembers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthMembersRepository extends JpaRepository<AuthMembers, Long> {
    boolean existsByLoginId(String loginId);
    AuthMembers findByLoginId(String loginId);
}
