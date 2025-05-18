package com.worldbeesion.beecareful.member.repository;

import com.worldbeesion.beecareful.member.model.MemberDevice;
import com.worldbeesion.beecareful.member.model.Members;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface MemberDeviceRepository extends JpaRepository<MemberDevice, Long> {
    Boolean existsByFcmToken(String fcmToken);
    Optional<MemberDevice> findByFcmToken(String fcmToken);
    Optional<MemberDevice> findByMembers(Members members);
}
