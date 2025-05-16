package com.worldbeesion.beecareful.notification.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum NotificationType {
    WARNING, // 말벌 출현시에
    SUCCESS, // 진단 완료. 질병 발견 X
    DANGER; // 진단 완료. 질병 감지
}
