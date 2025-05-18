package com.worldbeesion.beecareful.notification.model.dto;

import com.worldbeesion.beecareful.notification.constant.NotificationType;

public record NotificationRequestDto(
        Long beehiveId,
        String message,
        NotificationType status
) {
}
