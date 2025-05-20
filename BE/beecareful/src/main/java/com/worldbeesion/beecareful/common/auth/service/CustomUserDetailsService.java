package com.worldbeesion.beecareful.common.auth.service;

import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.member.exception.MemberNotFoundException;
import com.worldbeesion.beecareful.member.model.AuthMember;
import com.worldbeesion.beecareful.member.model.MemberInfoDto;
import com.worldbeesion.beecareful.member.model.Member;
import com.worldbeesion.beecareful.member.repository.AuthMembersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AuthMembersRepository authMembersRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AuthMember authMember = authMembersRepository.findByLoginId(username);

        if (authMember == null) {
            throw new MemberNotFoundException();
        }

        Member member = authMember.getMember();

        MemberInfoDto dto = new MemberInfoDto(member.getId(), authMember.getLoginId(), authMember.getPassword());

        return new UserDetailsImpl(dto);
    }
}
