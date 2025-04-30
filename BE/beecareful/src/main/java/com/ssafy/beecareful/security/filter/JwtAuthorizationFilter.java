package com.ssafy.beecareful.security.filter;

import com.ssafy.beecareful.common.constant.CookieConstant;
import com.ssafy.beecareful.common.util.CookieUtil;
import com.ssafy.beecareful.common.util.JwtUtil;
import com.ssafy.beecareful.member.constant.RoleType;
import com.ssafy.beecareful.security.auth.dto.MemberCompactDto;
import com.ssafy.beecareful.security.auth.principal.UserDetailsImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;


/**
 * 토큰 검증
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthorizationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    private final CookieUtil cookieUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Optional<String> optionalToken = cookieUtil.extractCookieValue(request, CookieConstant.AUTH_TOKEN_KEY);

        if (optionalToken.isEmpty()) {
            chain.doFilter(request, response);
            return;
        }
        String token = optionalToken.get();

        String memberId = jwtUtil.getMemberId(token);
        List<String> roles = jwtUtil.getRoles(token);
        String nickname = jwtUtil.getNickname(token);
        List<RoleType> memberRoles = roles.stream()
                .map(RoleType::valueOf)
                .toList();

        MemberCompactDto memberDto = new MemberCompactDto(memberId, null, nickname, null, memberRoles);

        Collection<GrantedAuthority> authorities = roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        UserDetailsImpl userDetails = new UserDetailsImpl(memberDto);

        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        chain.doFilter(request, response);
    }
}

