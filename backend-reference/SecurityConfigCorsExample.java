package com.example.predictor.authentication;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Example of merging CORS into your existing SecurityConfig.
 * <p>
 * Do not add this as a second {@code @Configuration} if you already have SecurityConfig —
 * merge the highlighted lines into your real {@code SecurityConfig} class.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfigCorsExample {

    private final AuthenticationService jwtAuthenticationFilter;

    public SecurityConfigCorsExample(AuthenticationService jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            // --- CORS: requires CorsConfigurationSource bean (see CorsConfig.java) ---
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(authz -> authz
                // Preflight requests do not carry JWT; must be allowed before /api/** auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
