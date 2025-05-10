package com.worldbeesion.beecareful.common.auth.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.common.constant.CookieConstant;
import com.worldbeesion.beecareful.common.util.CookieUtil;
import com.worldbeesion.beecareful.common.util.JwtTokenUtil;
import com.worldbeesion.beecareful.member.model.MemberLoginRequestDto;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Slf4j
public class JwtLoginAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private final JwtTokenUtil jwtTokenUtil;
    private final CookieUtil cookieUtil;
    private final ObjectMapper objectMapper;
    private final AuthenticationManager authenticationManager;

    public JwtLoginAuthenticationFilter(
            AuthenticationManager authenticationManager,
            JwtTokenUtil jwtTokenUtil,
            CookieUtil cookieUtil,
            ObjectMapper objectMapper
            ) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.cookieUtil = cookieUtil;
        this.objectMapper = objectMapper;
        this.authenticationManager = authenticationManager;
        this.setFilterProcessesUrl("/api/v1/members/login");
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) {
        try {
            MemberLoginRequestDto requestDto = objectMapper.readValue(request.getInputStream(), MemberLoginRequestDto.class);
            UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(requestDto.memberLoginId(), requestDto.password());
            return authenticationManager.authenticate(authRequest);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authentication) throws ServletException, IOException {
        final UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        final String jwtToken = jwtTokenUtil.createAccessToken(userDetails);
        Cookie cookie = cookieUtil.makeCookie(CookieConstant.AUTH_TOKEN, jwtToken);
        response.addCookie(cookie);

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Override
    @Autowired
    public void setAuthenticationManager(AuthenticationManager authenticationManager) {
        super.setAuthenticationManager(authenticationManager);
    }

}
