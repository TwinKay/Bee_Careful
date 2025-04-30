package com.ssafy.beecareful.member.repository;

import com.ssafy.beecareful.member.entity.Member;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByEmail(String email);
    Optional<Member> findByNickname(String nickname);

    boolean existsByNicknameOrEmail(String nickname, String email);

    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

}
