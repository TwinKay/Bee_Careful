package com.worldbeesion.beecareful.beehive.service;

import com.worldbeesion.beecareful.beehive.model.dto.BeehiveNotificationDto;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.notification.model.dto.NotificationRequestDto;

public interface BeehiveNotificationService {
    void sendBeehiveNotification(BeehiveNotificationDto beehiveNotificationDto, UserDetailsImpl userDetails);
}
