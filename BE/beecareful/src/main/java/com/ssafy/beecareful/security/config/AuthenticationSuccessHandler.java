package com.ssafy.beecareful.security.config;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.beecareful.security.auth.principal.UserDetailsImpl;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
public class AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final ObjectMapper objectMapper;
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        response.setContentType("application/json;charset=UTF-8");


        response.setStatus(HttpServletResponse.SC_OK);

        Map<String, Object> data = new HashMap<>();


        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        data.put("memberId", userDetails.getMemberId());
        data.put("nickname",userDetails.getNickname());
        response.getWriter().write(objectMapper.writeValueAsString(data));
    }

}
