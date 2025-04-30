package com.ssafy.beecareful.security.auth.service;

import com.ssafy.beecareful.member.entity.AuthMember;
import com.ssafy.beecareful.member.entity.Member;
import com.ssafy.beecareful.member.entity.MemberRole;
import com.ssafy.beecareful.member.repository.AuthMemberRepository;
import com.ssafy.beecareful.member.repository.MemberRepository;
import com.ssafy.beecareful.member.repository.MemberRoleRepository;
import com.ssafy.beecareful.security.auth.dto.MemberCompactDto;
import com.ssafy.beecareful.security.auth.principal.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;
    private final MemberRoleRepository memberRoleRepository;
    private final AuthMemberRepository authMemberRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AuthMember authMember = authMemberRepository.findByUsername(username).orElseThrow(RuntimeException::new); // 없는 사용자 오류
//        MemberCompactDto dto = new MemberCompactDto(authMember.getUsername()
//                , memberRoleRepository.findAllByMemberId(memberId).stream().map(MemberRole::getName)
//                .toList());
        Member member = authMember.getMember();

        MemberCompactDto dto = new MemberCompactDto(
                String.valueOf(member.getId())
                ,authMember.getUsername()
                ,member.getNickname()
                ,authMember.getPassword()
                ,memberRoleRepository.findAllByMemberId(member.getId()).stream().map(MemberRole::getName).toList()
                );
        return new UserDetailsImpl(dto);
    }
}
