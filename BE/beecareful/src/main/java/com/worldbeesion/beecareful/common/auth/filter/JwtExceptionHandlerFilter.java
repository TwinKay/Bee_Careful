package com.worldbeesion.beecareful.common.auth.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldbeesion.beecareful.common.constant.CookieConstant;
import com.worldbeesion.beecareful.common.exception.ErrorCode;
import com.worldbeesion.beecareful.common.util.CookieUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtExceptionHandlerFilter extends OncePerRequestFilter {

    private final CookieUtil cookieUtil;
    private final ObjectMapper objectMapper;


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } catch (SecurityException | MalformedJwtException e){
            log.info("Invalid JWT Token", e);
            handleJwtException(response);
        } catch (ExpiredJwtException e) {
            log.info("Expired JWT Token", e);
            handleJwtException(response);
        } catch (UnsupportedJwtException e) {
            log.info("Unsupported JWT Token", e);
            handleJwtException(response);
        } catch (IllegalArgumentException e) {
            log.info("JWT claims string is empty", e);
            handleJwtException(response);
        } catch (Exception e) {
            log.info("Cannot handle Jwt Exception with basic catch statement", e);
            handleJwtException(response);
        }
    }

    private void handleJwtException(HttpServletResponse response) throws IOException {
        deleteAuthCookie(response);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 인증 실패 상태 알리기
        response.setContentType("application/json"); // json으로 파싱할 수 있게 함

        Map<String, Object> data = new HashMap<>();
        data.put("message", ErrorCode.INVALID_TOKEN.getMessage());

        response.getWriter().write(objectMapper.writeValueAsString(data));
    }

    private void deleteAuthCookie(HttpServletResponse response) {
        Cookie cookie = cookieUtil.makeCookie(CookieConstant.AUTH_TOKEN, "", 0);
        response.addCookie(cookie);
    }

}
