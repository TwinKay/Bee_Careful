package com.worldbeesion.beecareful.beehive.service;

import com.worldbeesion.beecareful.beehive.exception.BeehiveNotFoundException;
import com.worldbeesion.beecareful.beehive.exception.TurretNotFoundException;
import com.worldbeesion.beecareful.beehive.model.dto.BeehiveNotificationDto;
import com.worldbeesion.beecareful.beehive.model.entity.Beehive;
import com.worldbeesion.beecareful.beehive.model.entity.Turret;
import com.worldbeesion.beecareful.beehive.repository.TurretRepository;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.notification.constant.NotificationType;
import com.worldbeesion.beecareful.notification.model.dto.NotificationRequestDto;
import com.worldbeesion.beecareful.notification.service.FCMService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BeehiveNotificationServiceImpl implements BeehiveNotificationService {

    private static final String HORNET_APPEAR_MESSAGE = "말벌이 출현했습니다.";

    private final TurretRepository turretRepository;
    private final FCMService fcmService;


    @Override
    @Transactional
    public void sendBeehiveNotification(BeehiveNotificationDto beehiveNotificationDto, UserDetailsImpl userDetails) {
        Turret turret = turretRepository.findBySerial(beehiveNotificationDto.serial()).orElseThrow(TurretNotFoundException::new);
        Beehive beehive = turret.getBeehive();

        if(beehive == null) {
            throw new BeehiveNotFoundException();
        }

        beehive.upHornetAppearedAt();

        NotificationRequestDto notificationRequestDto = new NotificationRequestDto(beehive.getId(), HORNET_APPEAR_MESSAGE, NotificationType.WARNING);
        fcmService.alertNotificationByFCM(userDetails, notificationRequestDto);
    }
}
