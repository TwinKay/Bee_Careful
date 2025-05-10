package com.worldbeesion.beecareful.common.util;

import com.worldbeesion.beecareful.common.constant.CookieConstant;
import com.worldbeesion.beecareful.common.exception.CookieNotFoundException;
import com.worldbeesion.beecareful.common.exception.TokenNotFoundException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import java.util.Arrays;

@Component
public class CookieUtil {

    // 쿠키 만들기
    public Cookie makeCookie(String name, String value) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        return cookie;
    }

    // 쿠키 만들기
    public Cookie makeCookie(String name, String value, int expires) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setMaxAge(expires);
        return cookie;
    }




    // 쿠키에서 jwt 토큰 추출하기
    private String extractJwtFromCookie(HttpServletRequest request) {
        if(request.getCookies() == null) {
            throw new CookieNotFoundException();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> cookie.getName().equals(CookieConstant.AUTH_TOKEN))
                .map(Cookie::getValue)
                .findFirst()
                .orElseThrow(() -> new TokenNotFoundException());
    }

}
