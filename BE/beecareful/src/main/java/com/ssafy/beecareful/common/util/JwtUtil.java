package com.ssafy.beecareful.common.util;

import com.ssafy.beecareful.member.constant.RoleType;
import com.ssafy.beecareful.security.auth.principal.UserDetailsImpl;
import io.jsonwebtoken.Jwts;
import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
@Component
public class JwtUtil {

    // 시간단위 : MS

    private final SecretKey secretKey;

    private final long accessExpirationMillis;

    private final long refreshExpirationMillis;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration.access-token}") long accessExpirationMillis,
            @Value("${jwt.expiration.refresh-token}") long refreshExpirationMillis) {
        this.secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), Jwts.SIG.HS256.key().build().getAlgorithm());
        this.accessExpirationMillis = accessExpirationMillis;
        this.refreshExpirationMillis = refreshExpirationMillis;
    }

    public String getMemberId(String token) {
        return parsePayload(token, "memberId", String.class);
    }

    public String getNickname(String token){
        return parsePayload(token,"nickname",String.class);
    }

    public List<String> getRoles(String token) {
        return (List<String>) parsePayload(token, "role", List.class);
    }

    private <T> T parsePayload(String token, String key, Class<T> clazz) {
        return Jwts.parser().verifyWith(secretKey).build()
                .parseSignedClaims(token)
                .getPayload()
                .get(key, clazz);
    }

    public String createAccessToken(UserDetailsImpl userDetails){
        return createToken(userDetails.getMemberId(),userDetails.getNickname(),userDetails.getRoles(),accessExpirationMillis);
    }



    private String createToken(String memberId, String nickname, List<RoleType> roles, long expiration) {
        return Jwts.builder()
                .claim("memberId", memberId)
                .claim("role", roles.stream().map(Enum::name).toList())
                .claim("nickname", nickname)
                .issuedAt(generateIssuedAt())
                .expiration(generateTokenExpiration(expiration))
                .signWith(secretKey)
                .compact();
    }

    private Date generateIssuedAt() {
        return Date.from(ZonedDateTime.now().toInstant());

    }

    private Date generateTokenExpiration(long delta) {
        return Date.from(ZonedDateTime.now().plusSeconds(delta).toInstant());
    }

}