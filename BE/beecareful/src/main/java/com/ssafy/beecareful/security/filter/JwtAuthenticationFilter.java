package com.ssafy.beecareful.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.beecareful.common.constant.CookieConstant;
import com.ssafy.beecareful.common.util.CookieUtil;
import com.ssafy.beecareful.common.util.JwtUtil;
import com.ssafy.beecareful.security.auth.dto.MemberLogin;
import com.ssafy.beecareful.security.auth.principal.UserDetailsImpl;
import com.ssafy.beecareful.security.config.AuthenticationFailureHandler;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;

/**
 * 일반 로그인
 */
@Component
@Slf4j
public class JwtAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private final JwtUtil jwtUtil;
    private final CookieUtil cookieUtil;
    private final ObjectMapper om;
    private final AuthenticationManager authenticationManager;




    public JwtAuthenticationFilter(
            JwtUtil jwtUtil
            , CookieUtil cookieUtil
            , ObjectMapper objectMapper
            , AuthenticationManager authenticationManager
            , AuthenticationSuccessHandler authenticationSuccessHandler
            , AuthenticationFailureHandler authenticationFailureHandler){
        this.jwtUtil = jwtUtil;
        this.cookieUtil = cookieUtil;
        this.om = objectMapper;
        this.authenticationManager = authenticationManager;
        this.setAuthenticationSuccessHandler(authenticationSuccessHandler);
        this.setFilterProcessesUrl("/api/auth/login");
        this.setAuthenticationFailureHandler(authenticationFailureHandler);
    }


    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {

        try {
            MemberLogin loginRequestDto = om.readValue(request.getInputStream(), MemberLogin.class);

            UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(loginRequestDto.email(), loginRequestDto.password());

            return authenticationManager.authenticate(authenticationToken);
        } catch (IOException e) {
            e.printStackTrace();
            throw new RuntimeException();
            //TODO Exception Handling
//            return null;
        }
    }

    @Override
    protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authenticate) throws IOException, ServletException {
        final UserDetailsImpl userDetails = (UserDetailsImpl) authenticate.getPrincipal();

        final String token = jwtUtil.createAccessToken(userDetails);
        Cookie cookie = cookieUtil.createCookie(CookieConstant.AUTH_TOKEN_KEY, token);
        response.addCookie(cookie);

        SecurityContextHolder.getContext().setAuthentication(authenticate);
        super.successfulAuthentication(request, response, chain, authenticate);
    }

//    @Override
//    protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response, AuthenticationException failed) throws IOException, ServletException {
//        System.out.println("인증실패?");
//        this.getFailureHandler().onAuthenticationFailure(request, response, failed);
//    }



    @Override
    @Autowired
    public void setAuthenticationManager(AuthenticationManager authenticationManager) {
        super.setAuthenticationManager(authenticationManager);
    }
}
