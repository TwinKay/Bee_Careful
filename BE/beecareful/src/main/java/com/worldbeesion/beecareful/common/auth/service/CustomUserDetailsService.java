package com.worldbeesion.beecareful.common.auth.service;

import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.member.exception.MemberNotFoundException;
import com.worldbeesion.beecareful.member.model.AuthMembers;
import com.worldbeesion.beecareful.member.model.MemberInfoDto;
import com.worldbeesion.beecareful.member.model.Members;
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
        AuthMembers authMembers = authMembersRepository.findByLoginId(username);

        if (authMembers == null) {
            throw new MemberNotFoundException();
        }

        Members members = authMembers.getMember();

        MemberInfoDto dto = new MemberInfoDto(members.getId(), authMembers.getLoginId(), authMembers.getPassword());

        return new UserDetailsImpl(dto);
    }
}
