package com.ssafy.beecareful.security.config;

import com.ssafy.beecareful.security.filter.JwtAuthorizationFilter;
import com.ssafy.beecareful.security.filter.JwtExceptionHandleFilter;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, prePostEnabled = true)
public class SecurityConfig {

    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;

    private final String CLIENT_URL;



    public SecurityConfig(
            @Value("${client.base-url}") String clientUrl
            , CustomAuthenticationEntryPoint customAuthenticationEntryPoint
            , CustomAccessDeniedHandler customAccessDeniedHandler
    ) {
        this.CLIENT_URL = clientUrl;
        this.customAuthenticationEntryPoint = customAuthenticationEntryPoint;
        this.customAccessDeniedHandler = customAccessDeniedHandler;
    }


    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http
            , JwtAuthorizationFilter jwtAuthorizationFilter
            , JwtAuthorizationFilter jwtAuthenticationFilter
            , JwtExceptionHandleFilter jwtExceptionHandleFilter) throws Exception {

        // CSRF 설정 (Cross-site request forgery)
        http
                .csrf(AbstractHttpConfigurer::disable);

        // 인증되지 않은 사용자의 경우 securityContextHolder에 annoymous 데이터가 들어가는거 방지
        http
                .anonymous(AbstractHttpConfigurer::disable);

        // 전역적으로 모든 응답의 캐싱을방지
        http
                .headers(httpSecurityHeadersConfigurer -> httpSecurityHeadersConfigurer.cacheControl(HeadersConfigurer.CacheControlConfig::disable));

        // 세션X
        http
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // CORS 설정
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()));// CORS 설정 추가


        // X-Frame-Option 에 관한 설정
        // SameOrigin으로 적용하여 H2-Console을 비롯한 iframe 동작
        http
                .headers(header -> header.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin));


        // (시큐리티)인가 URL Pattern을 정의하는 설정
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll() // 로그인
                        .requestMatchers("/api/member").permitAll() // 회원가입
                        .requestMatchers("/api/member/exist").permitAll() // 회원 중복 조회
                        .requestMatchers("/api/member/following").permitAll()// 팔로잉 목록 조회
                        .requestMatchers("/api/auction/*/related").permitAll() // 관련 매물 조회
                        .requestMatchers("/api/auction").permitAll() // 경매 목록 조회
                        .requestMatchers("/api/pay/deposit/*").permitAll() // 페이 리다이렉트
                        .requestMatchers("/api/health").permitAll() // 헬스 체크
                        .requestMatchers("/api/test/**").permitAll() // 헬스 체크
                        .anyRequest().authenticated());


        // HttpBasicAuthentication 비활성화
        http
                .httpBasic(AbstractHttpConfigurer::disable);

        // formLogin 에 대한 설정
        http
                .formLogin(AbstractHttpConfigurer::disable);


        // 인증,인가에 대한 오류처리를 커스텀하여 적용
        http.exceptionHandling(configurer -> configurer
                .authenticationEntryPoint(customAuthenticationEntryPoint)
                .accessDeniedHandler(customAccessDeniedHandler));

        http
                .addFilterBefore(jwtAuthorizationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAt(
                        jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtExceptionHandleFilter, JwtAuthorizationFilter.class)
        ;
        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")); // 허용할 HTTP 메서드
        configuration.setAllowedHeaders(Arrays.asList("*")); // 모든 헤더 허용
        configuration.setAllowCredentials(true); // 쿠키 허용
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}