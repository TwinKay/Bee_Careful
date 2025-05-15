package com.worldbeesion.beecareful.common.util;

import com.worldbeesion.beecareful.common.constant.CookieConstant;
import com.worldbeesion.beecareful.common.exception.CookieNotFoundException;
import com.worldbeesion.beecareful.common.exception.TokenNotFoundException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.Optional;

@Component
public class CookieUtil {

    // 쿠키 만들기
    public Cookie makeCookie(String name, String value) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setAttribute("SameSite", "None");
        cookie.setSecure(true);
        return cookie;
    }

    // 쿠키 만들기
    public Cookie makeCookie(String name, String value, int expires) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setAttribute("SameSite", "None");
        cookie.setSecure(true);
        cookie.setMaxAge(expires);
        return cookie;
    }



    public Optional<String> extractCookieValue(HttpServletRequest request, String key) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> cookie.getName().equals(key))
                .findFirst()
                .map(Cookie::getValue);
    }


}
