package com.ssafy.beecareful.member.repository;

import com.ssafy.beecareful.member.entity.MemberRole;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberRoleRepository extends JpaRepository<MemberRole, Long> {
    List<MemberRole> findAllByMemberId(Long memberId);

}
