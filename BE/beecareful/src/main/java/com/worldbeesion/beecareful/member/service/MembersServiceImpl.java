package com.worldbeesion.beecareful.member.service;

import com.worldbeesion.beecareful.beehive.model.entity.Apiary;
import com.worldbeesion.beecareful.beehive.repository.ApiaryRepository;
import com.worldbeesion.beecareful.member.exception.AlreadyExistMemberName;
import com.worldbeesion.beecareful.member.model.AuthMembers;
import com.worldbeesion.beecareful.member.model.MemberSignUpRequestDto;
import com.worldbeesion.beecareful.member.model.Members;
import com.worldbeesion.beecareful.member.repository.AuthMembersRepository;
import com.worldbeesion.beecareful.member.repository.MembersRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MembersServiceImpl implements MemberService {

    private final MembersRepository membersRepository;
    private final AuthMembersRepository authMembersRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApiaryRepository apiaryRepository;

    @Transactional
    public void signUp(MemberSignUpRequestDto memberSignUpRequestDto) {
        String memberLoginId = memberSignUpRequestDto.memberLoginId();
        String password = memberSignUpRequestDto.password();
        String memberName = memberSignUpRequestDto.memberName();
        String phone = memberSignUpRequestDto.phone();

        if(authMembersRepository.existsByLoginId(memberLoginId)) {
            throw new AlreadyExistMemberName();
        }

        Members member = new Members(memberName, phone);
        membersRepository.save(member);
        AuthMembers authMember = new AuthMembers(member, memberLoginId, passwordEncoder.encode(password));
        authMembersRepository.save(authMember);

        Apiary apiary = Apiary.builder()
                .members(member)
                .build();

        apiaryRepository.save(apiary);
    }

}
