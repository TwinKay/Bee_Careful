package com.worldbeesion.beecareful.member.service;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.member.exception.AlreadyExistMemberName;
import com.worldbeesion.beecareful.member.exception.BadRequestException;
import com.worldbeesion.beecareful.member.model.AuthMembers;
import com.worldbeesion.beecareful.member.model.MemberSignUpRequestDto;
import com.worldbeesion.beecareful.member.model.Members;
import com.worldbeesion.beecareful.member.repository.AuthMembersRepository;
import com.worldbeesion.beecareful.member.repository.MembersRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MembersService {

    private final MembersRepository membersRepository;
    private final AuthMembersRepository authMembersRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void signUp(MemberSignUpRequestDto memberSignUpRequestDto) {
        try {
            String memberLoginId = memberSignUpRequestDto.memberLoginId();
            String password = memberSignUpRequestDto.password();
            String memberName = memberSignUpRequestDto.memberName();
            String phone = memberSignUpRequestDto.phone();

            if(authMembersRepository.existsByLoginId(memberLoginId)) {
                throw new AlreadyExistMemberName();
            }

            Members member = new Members(memberName, phone, LocalDateTime.now(), LocalDateTime.now());
            membersRepository.save(member);
            AuthMembers authMember = new AuthMembers(member, memberLoginId, passwordEncoder.encode(password));
            authMembersRepository.save(authMember);
        } catch (CommonException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException();
        }

    }
}
