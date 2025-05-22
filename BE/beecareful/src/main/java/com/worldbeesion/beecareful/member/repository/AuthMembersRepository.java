package com.worldbeesion.beecareful.member.repository;

import com.worldbeesion.beecareful.member.model.AuthMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthMembersRepository extends JpaRepository<AuthMember, Long> {
    boolean existsByLoginId(String loginId);
    AuthMember findByLoginId(String loginId);
}
