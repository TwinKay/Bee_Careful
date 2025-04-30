package com.ssafy.beecareful.security.auth.dto;


import com.ssafy.beecareful.member.constant.RoleType;
import java.util.List;

public record MemberCompactDto(String memberId, String email, String nickname, String password, List<RoleType> roles) {
}
