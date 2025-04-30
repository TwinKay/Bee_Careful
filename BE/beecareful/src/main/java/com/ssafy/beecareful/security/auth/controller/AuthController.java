package com.ssafy.beecareful.security.auth.controller;


import com.ssafy.beecareful.common.constant.CookieConstant;
import com.ssafy.beecareful.common.exception.UnauthorizedException;
import com.ssafy.beecareful.common.util.CookieUtil;
import com.ssafy.beecareful.security.auth.dto.SimpleMemberInfoDto;
import com.ssafy.beecareful.security.util.SecurityContextUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping(path = "/api/auth")
public class AuthController {

    private final SecurityContextUtil securityContextUtil;

    private final CookieUtil cookieUtil;

    @GetMapping("/me")
    public ResponseEntity<SimpleMemberInfoDto> amIAuthorized(
            @RequestHeader(value = "Device-Token", required = false) String deviceToken
    ){
        Optional<Long> memberId = securityContextUtil.extractMemberId();
        Optional<String> nickname = securityContextUtil.extractNickname();
        if(memberId.isEmpty()|| nickname.isEmpty()){
            throw new UnauthorizedException();
        }

        return ResponseEntity
                .ok()
                .body(new SimpleMemberInfoDto(memberId.get(),nickname.get()));
    }


    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Device-Token", required = false) String deviceToken
            , HttpServletRequest request
            , HttpServletResponse response){
        Long memberId = securityContextUtil.extractMemberId().orElseThrow(UnauthorizedException::new);

        Cookie cookie = cookieUtil.createCookie(CookieConstant.AUTH_TOKEN_KEY, "", 0);

        response.addCookie(cookie);
        request.getSession().invalidate();

        return ResponseEntity.ok().build();
    }
}
