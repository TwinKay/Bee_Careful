package com.worldbeesion.beecareful.common.auth.principal;


import com.worldbeesion.beecareful.member.model.MemberInfoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;


@RequiredArgsConstructor
public class UserDetailsImpl implements UserDetails {

    private final MemberInfoDto memberInfoDto;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }

    @Override
    public String getPassword() {
        return memberInfoDto.password();
    }

    @Override
    public String getUsername() {
        return memberInfoDto.memberLoginId();
    }

    public Long getMemberId() {
        return memberInfoDto.memberId();
    }
}
