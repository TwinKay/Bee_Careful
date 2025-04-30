package com.ssafy.beecareful.member.repository;

import com.ssafy.beecareful.member.entity.AuthMember;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface AuthMemberRepository extends JpaRepository<AuthMember, Long> {
    Optional<AuthMember> findByUsername(String username);
}
