package com.ssafy.beecareful.config;

import com.fasterxml.jackson.databind.module.SimpleModule;
import com.ssafy.beecareful.common.util.LocalDateTimeToUTCSerializer;
import java.time.LocalDateTime;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {
    
    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> {
            // 예시: null 값은 직렬화하지 않음
//            builder.serializationInclusion(JsonInclude.Include.NON_NULL);
            // 예시: 출력 시 들여쓰기를 적용
//            builder.featuresToEnable(SerializationFeature.INDENT_OUTPUT);

            SimpleModule module = new SimpleModule();
            module.addSerializer(LocalDateTime.class, new LocalDateTimeToUTCSerializer());
            builder.modulesToInstall(module);

        };
    }
//    @Bean
//    public ObjectMapper objectMapper() {
//        ObjectMapper objectMapper = new ObjectMapper();
//        SimpleModule module = new SimpleModule();
//        module.addSerializer(LocalDateTime.class, new LocalDateTimeToUTCSerializer());
//        objectMapper.registerModule(module);
//        return objectMapper;
//    }
}
