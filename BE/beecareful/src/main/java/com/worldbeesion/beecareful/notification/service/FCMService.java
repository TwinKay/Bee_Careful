package com.worldbeesion.beecareful.notification.service;

import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.notification.model.dto.NotificationRequestDto;
import org.springframework.security.core.userdetails.UserDetails;

public interface FCMService {
    void alertNotificationByFCM(UserDetailsImpl userDetails, NotificationRequestDto notificationRequestDto);
}