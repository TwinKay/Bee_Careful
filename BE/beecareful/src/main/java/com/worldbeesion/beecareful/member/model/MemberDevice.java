package com.worldbeesion.beecareful.member.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "member_device")
public class MemberDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_device_id")
    private Long id;

    @OneToOne
    @JoinColumn(name = "member_id", nullable = false)
    private Members members;

    @Column(name = "fcm_token", nullable = false)
    private String fcmToken;

}
