package com.worldbeesion.beecareful.notification.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.member.exception.MemberNotFoundException;
import com.worldbeesion.beecareful.member.model.MemberDevice;
import com.worldbeesion.beecareful.member.model.Member;
import com.worldbeesion.beecareful.member.repository.MemberDeviceRepository;
import com.worldbeesion.beecareful.member.repository.MembersRepository;
import com.worldbeesion.beecareful.notification.exception.DeviceNotFoundException;
import com.worldbeesion.beecareful.notification.model.dto.NotificationRequestDto;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@AllArgsConstructor
public class FCMServiceImpl implements FCMService {
    private static final String NOTIFICATION_COMMON_TITLE = "[⚠ 알림]";
    private static final String NOTIFICATION_COMMON_BEEHIVE = "벌통의 ";
    private static final String NOTIFICATION_COMMON_STATUS = " 상태가 발견되었습니다.";
    private final MembersRepository membersRepository;
    private final MemberDeviceRepository memberDeviceRepository;


    @Override
    public void alertNotificationByFCM(UserDetailsImpl userDetails, NotificationRequestDto notificationRequestDto) {
        Member member = membersRepository.findById(userDetails.getMemberId()).orElseThrow(MemberNotFoundException::new);
        MemberDevice memberDevice = memberDeviceRepository.findByMembers(member).orElseThrow(DeviceNotFoundException::new);


        String body = NOTIFICATION_COMMON_BEEHIVE + notificationRequestDto.status() + NOTIFICATION_COMMON_STATUS;

        sendMessage(memberDevice.getFcmToken(), NOTIFICATION_COMMON_TITLE ,body, notificationRequestDto);

    }

    private void sendMessage(String token, String title, String body, NotificationRequestDto dto) {
        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        Map<String, String> data = Map.of(
                "beehiveId", String.valueOf(dto.beehiveId()),
                "message", dto.message(),
                "status", dto.status().name()
        );

        Message message = Message.builder()
                .setToken(token)
                .setNotification(notification)
                .putAllData(data)
                .build();

        try {
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("✅ FCM 메시지 전송 성공: " + response);
        } catch (FirebaseMessagingException e) {
            System.err.println("❌ FCM 메시지 전송 실패: " + e.getMessage());
        }

    }

    @Override
    public void alertNotificationByFCM(Member member, NotificationRequestDto notificationRequestDto) {
        MemberDevice memberDevice = memberDeviceRepository.findByMembers(member).orElseThrow(DeviceNotFoundException::new);

        String body = NOTIFICATION_COMMON_BEEHIVE + notificationRequestDto.status() + NOTIFICATION_COMMON_STATUS;

        sendMessage(memberDevice.getFcmToken(), NOTIFICATION_COMMON_TITLE ,body, notificationRequestDto);

    }
}
