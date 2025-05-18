package com.worldbeesion.beecareful.member.service;

import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;

public interface MemberDeviceService {
    void updateFcmToken(UserDetailsImpl userDetails, String fcmToken);
}
