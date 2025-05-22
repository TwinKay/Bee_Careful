package com.worldbeesion.beecareful.member.model;

public record MemberSignUpRequestDto(String memberLoginId, String password, String memberName, String phone) {
}
