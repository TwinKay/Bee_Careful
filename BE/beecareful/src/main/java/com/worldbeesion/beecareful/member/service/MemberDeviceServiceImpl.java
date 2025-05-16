package com.worldbeesion.beecareful.member.service;

import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.member.exception.MemberNotFoundException;
import com.worldbeesion.beecareful.member.model.MemberDevice;
import com.worldbeesion.beecareful.member.model.Members;
import com.worldbeesion.beecareful.member.repository.MemberDeviceRepository;
import com.worldbeesion.beecareful.member.repository.MembersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class MemberDeviceServiceImpl implements MemberDeviceService {

    private final MemberDeviceRepository memberDeviceRepository;
    private final MembersRepository membersRepository;

    @Override
    @Transactional
    public void updateFcmToken(UserDetailsImpl userDetails, String fcmToken) {
        // 1. 한대의 토큰에서 사용자가 두명 (한개 기기에 로그인 여러명)
        // 이거 안되어야함
        // 현재 FCM 토큰을 조회했을때 사용자가 있으면 삭제하고, 현재 사용자로 FCM 토큰을 등록
        MemberDevice memberDevice = memberDeviceRepository.findByFcmToken(fcmToken).orElse(null);
        if (memberDevice != null && !memberDevice.getMembers().getId().equals(userDetails.getMemberId())) {
            memberDeviceRepository.delete(memberDevice);
        }


        // 2. 한명이 FCM 토큰을 두개 이상 가지는 경우(기기가 여러개, 예전에 다른 기기로 접속하고 또 접속함)
        // 이거 안되어야함.
        // 현재 접속한 사용자로 FCM 토큰을 조회했을때 기기를 삭제하고, 현재 FCM 토큰을 DB에 등록
        Members member = membersRepository.findById(userDetails.getMemberId()).orElseThrow(MemberNotFoundException::new);
        MemberDevice existingByMember = memberDeviceRepository.findByMembers(member).orElse(null);
        if (existingByMember != null) {
            memberDeviceRepository.delete(existingByMember);
        }

        MemberDevice newMemberDevice = MemberDevice.builder()
                                        .members(member)
                                        .fcmToken(fcmToken)
                                        .build();

        memberDeviceRepository.save(newMemberDevice);

    }

}
