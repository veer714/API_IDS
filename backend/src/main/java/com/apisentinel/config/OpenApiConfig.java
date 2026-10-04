package com.apisentinel.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI apiSentinelOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API Sentinel - Backend API")
                        .description("REST API documentation for API Sentinel Intrusion Detection System backend service")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("API Sentinel Team")
                                .email("backend@apisentinel.local"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}
