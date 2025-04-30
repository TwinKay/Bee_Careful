package com.ssafy.beecareful.member.repository;

import com.ssafy.beecareful.member.entity.MemberDevice;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberDeviceRepository extends JpaRepository<MemberDevice, Long> {

    List<MemberDevice> findAllByMemberId(Long memberId);

    void deleteByMemberIdAndFcmToken(Long memberId, String fcmToken);

    Optional<MemberDevice> findByFcmToken(String fcmToken);
}
