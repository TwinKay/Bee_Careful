package com.worldbeesion.beecareful;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class BeecarefulApplication {

	public static void main(String[] args) {
		SpringApplication.run(BeecarefulApplication.class, args);
	}

}
