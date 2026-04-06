package com.example.predictor.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * CORS for the Vite dev server (and optional production front-end URL).
 * <p>
 * Copy this class into your Spring Boot project under
 * {@code src/main/java/com/example/predictor/config/} (adjust package if needed).
 * <p>
 * In {@code SecurityConfig}, you must also:
 * <ul>
 *   <li>Call {@code http.cors(Customizer.withDefaults());}</li>
 *   <li>Permit {@code OPTIONS} preflight: {@code .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()}</li>
 * </ul>
 * See {@code SecurityConfigCorsExample.java} in this folder.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Vite default ports; add your deployed UI origin when you go to production
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        // JWT in Authorization header only — false avoids cookie + origin edge cases
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
