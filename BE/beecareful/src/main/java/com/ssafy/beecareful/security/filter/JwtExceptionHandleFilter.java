package com.ssafy.beecareful.security.filter;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.beecareful.common.constant.CookieConstant;
import com.ssafy.beecareful.common.exception.ErrorCode;
import com.ssafy.beecareful.common.util.CookieUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;


@RequiredArgsConstructor
@Component
@Slf4j
public class JwtExceptionHandleFilter extends OncePerRequestFilter {

    private final CookieUtil cookieUtil;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try{
            filterChain.doFilter(request, response);
        }catch (SecurityException | MalformedJwtException e) {
            // 잘못된 JWT 서명 or 형식오류
            handleJwtException(response);
        } catch (ExpiredJwtException e) {
            // JWT 토큰 만료
            handleJwtException(response);
        } catch (Exception e){
            handleJwtException(response);
        }
    }

    private void handleJwtException(HttpServletResponse response) throws IOException {
        deleteAuthCookie(response); // 쿠키 삭제
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");

        Map<String, Object> data = new HashMap<>();
        data.put("code", ErrorCode.TOKEN_VALIDATION_FAIL.getCode());
        data.put("message",ErrorCode.TOKEN_VALIDATION_FAIL.getMessage());
        response.getWriter().write(objectMapper.writeValueAsString(data));
    }
    private void deleteAuthCookie(HttpServletResponse response){
        Cookie cookie = cookieUtil.createCookie(CookieConstant.AUTH_TOKEN_KEY, "", 0);
        response.addCookie(cookie);
    }
}
