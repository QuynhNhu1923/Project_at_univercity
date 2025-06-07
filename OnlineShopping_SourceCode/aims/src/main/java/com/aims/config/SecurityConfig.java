package com.aims.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .authorizeHttpRequests(auth -> auth
                        // Các endpoint công khai
                        .requestMatchers("/api/auth/**", "/api/carts/**", "/api/products/**", "/api/orders/**", "/api/payments/vnpay").permitAll()
                        .requestMatchers("/pages/**", "/js/**", "/css/**").permitAll() // Cho phép tài nguyên tĩnh
                        // Quyền của Product Manager
                        .requestMatchers("/api/products/create", "/api/products/update", "/api/products/delete/**").hasRole("PRODUCT_MANAGER")
                        .requestMatchers("/api/orders/approve/**", "/api/orders/reject/**").hasRole("PRODUCT_MANAGER")
                        // Quyền của Admin
                        .requestMatchers("/api/users/**").hasRole("ADMIN")
                        // Tất cả các request khác yêu cầu xác thực
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}