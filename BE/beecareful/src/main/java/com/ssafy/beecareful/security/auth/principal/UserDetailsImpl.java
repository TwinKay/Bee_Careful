package com.ssafy.beecareful.security.auth.principal;

import com.ssafy.beecareful.member.constant.RoleType;
import com.ssafy.beecareful.security.auth.dto.MemberCompactDto;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;


public class UserDetailsImpl implements UserDetails {

    private final MemberCompactDto dto;

    public UserDetailsImpl(MemberCompactDto dto) {
        this.dto = dto;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {

        Collection<? extends GrantedAuthority> authorities = dto.roles()
                .stream()
                .map(RoleType::name)
                .map(SimpleGrantedAuthority::new)
                .toList();
        return authorities;
    }

    // 사용자 고유 식별자.
    @Override
    public String getUsername() {
        return dto.email();
    }

    @Override
    public String getPassword() {
        return dto.password();
    }

    public String getMemberId() {
        return dto.memberId();
    }

    public String getNickname(){
        return dto.nickname();
    }

    public List<RoleType> getRoles() {
        return dto.roles();
    }

}
