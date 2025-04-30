package com.ssafy.beecareful.security.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.beecareful.common.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
/**
 * 인증된 사용자가 권한이 없는 리소스에 접근할 때 발생하는 예외쳐리
 */
@Component
@RequiredArgsConstructor
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException {

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");

        Map<String, Object> data = new HashMap<>();
        data.put("message", ErrorCode.FORBIDDEN.getMessage());
        data.put("code", ErrorCode.FORBIDDEN.getCode());

        response.getWriter().write(objectMapper.writeValueAsString(data));
    }
}