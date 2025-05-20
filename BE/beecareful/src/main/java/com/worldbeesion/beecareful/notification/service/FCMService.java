package com.worldbeesion.beecareful.notification.service;

import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.notification.model.dto.NotificationRequestDto;
import com.worldbeesion.beecareful.member.model.Member;

public interface FCMService {
    void alertNotificationByFCM(UserDetailsImpl userDetails, NotificationRequestDto notificationRequestDto);

    void alertNotificationByFCM(Member member, NotificationRequestDto notificationRequestDto);
}