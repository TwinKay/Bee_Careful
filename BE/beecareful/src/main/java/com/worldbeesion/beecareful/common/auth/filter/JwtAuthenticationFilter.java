package com.worldbeesion.beecareful.common.auth.filter;

import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import com.worldbeesion.beecareful.common.constant.CookieConstant;
import com.worldbeesion.beecareful.common.util.CookieUtil;
import com.worldbeesion.beecareful.common.util.JwtTokenUtil;
import com.worldbeesion.beecareful.member.model.MemberInfoDto;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwtTokenUtil;
    private final CookieUtil cookieUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        Optional<String> token = cookieUtil.extractCookieValue(request, CookieConstant.AUTH_TOKEN);

        if(token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwtToken = token.get();
        Long memberId = jwtTokenUtil.getMemberIdFromToken(jwtToken);
        MemberInfoDto memberInfoDto = new MemberInfoDto(memberId, null, null);

        UserDetailsImpl userDetails = new UserDetailsImpl(memberInfoDto);
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
