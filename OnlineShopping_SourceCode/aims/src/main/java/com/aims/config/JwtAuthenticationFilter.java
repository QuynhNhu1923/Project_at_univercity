package com.aims.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Date;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private UserDetailsService userDetailsService;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        logger.debug("Request URI: " + request.getRequestURI());
        logger.debug("Request Method: " + request.getMethod());
        logger.debug("Is Public API: " + isPublicApi(request));

        String path = request.getRequestURI();
        String method = request.getMethod();

        String header = request.getHeader("Authorization");
        logger.debug("Request Path: " + request.getRequestURI());
        logger.debug("Request Method: " + request.getMethod());
        logger.debug("Header Authorization: " + request.getHeader("Authorization"));

        if (isPublicApi(request)) {
            logger.debug("Skipping JWT check for public API: {}", path);
            chain.doFilter(request, response);
            return;
        }

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(getSigningKey())
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                String email = claims.getSubject();
                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    if (userDetails != null) {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        logger.debug("Authenticated user: {}", email);
                    }
                }
            } catch (Exception e) {
                logger.warn("Invalid JWT token: {}", e.getMessage());
                // Cho phép tiếp tục như anonymous
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isPublicApi(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) return true;
        if ("POST".equalsIgnoreCase(method) && path.matches("^/api/carts/[^/]+/items$")) return true;
        return path.startsWith("/api/auth") ||
                path.startsWith("/api/products") ||
                path.startsWith("/api/orders") ||
                path.startsWith("/api/payments") ||
                path.startsWith("/api/carts/") ||
                path.startsWith("/api/product-history/") || // Thêm để công khai
                path.startsWith("/pages/") ||
                path.startsWith("/js/") ||
                path.startsWith("/css/") ||
                path.equals("/favicon.ico") ||
                path.equals("/index.html") ||
                path.equals("/role-selection.html") ||
                path.equals("/error");
    }

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }
}