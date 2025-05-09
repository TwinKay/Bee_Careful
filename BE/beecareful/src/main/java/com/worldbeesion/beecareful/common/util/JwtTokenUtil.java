package com.worldbeesion.beecareful.common.util;

import com.worldbeesion.beecareful.member.model.MemberInfoDto;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.ZonedDateTime;
import java.util.Date;

@Component
public class JwtTokenUtil {

    private final Key secretKey;

    private static final long EXPIRED_TIME_IN_SECONDS = 60 * 60 * 24 * 2; // 2일


    public JwtTokenUtil(@Value("${jwt.secretKey}") String secretKey) {
        this.secretKey =  Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    // JWT의 페이로드에서 클레임을 추출하는 코드 . 페이로드 == 클레임
    public Claims parseClaims(String accessToken) {
        try {
            return Jwts.parserBuilder() // JWT 파서를 생성
                    .setSigningKey(secretKey) // 서명 검증에 사용할 키를 설정
                    .build()
                    .parseClaimsJws(accessToken) // JWT 파싱하고 유효성 검증
                    .getBody(); // JWT의 페이로드 반환
        } catch(ExpiredJwtException e) {
            return e.getClaims(); // 만료된 토큰의 클레임을 반환. 예외 객체의 클레임 정보가 들어있다.
        }
    }


    public String accessTokenGenerate(MemberInfoDto infoDto) {
        Claims claims = Jwts.claims();
        claims.setSubject(String.valueOf(infoDto.memberId()));

        ZonedDateTime now = ZonedDateTime.now();
        ZonedDateTime expiresAt = now.plusSeconds(EXPIRED_TIME_IN_SECONDS);
        Date expiresAtDate = Date.from(expiresAt.toInstant());

        return Jwts.builder()
                .setSubject(String.valueOf(infoDto.memberId()))
                .setExpiration(expiresAtDate)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }
}
