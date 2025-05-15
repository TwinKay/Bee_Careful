package com.worldbeesion.beecareful.member.model;

public record MemberLoginRequestDto(String memberLoginId, String password, String fcmToken) {
}
