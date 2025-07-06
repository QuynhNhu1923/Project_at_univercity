package com.aims.service;

import com.aims.model.User;
import com.aims.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        logger.info("=== LOADING USER DETAILS ===");
        logger.info("Loading user by email: {}", email);
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (!userOpt.isPresent()) {
            logger.error("User not found with email: {}", email);
            throw new UsernameNotFoundException("User not found with email: " + email);
        }

        User foundUser = userOpt.get();
        logger.info("User found: ID={}, Email={}, Status={}", foundUser.getUserId(), foundUser.getEmail(), foundUser.getStatus());

        if (!"active".equals(foundUser.getStatus())) {
            logger.warn("User account is not active: {}", email);
            throw new UsernameNotFoundException("User account is blocked or inactive");
        }

        // Log user roles
        logger.info("User roles count: {}", foundUser.getRoles() != null ? foundUser.getRoles().size() : 0);
        if (foundUser.getRoles() != null) {
            foundUser.getRoles().forEach(role -> {
                logger.info("User role: {}", role.getRoleName());
            });
        }

        // Create authorities with ROLE_ prefix for Spring Security
        java.util.List<SimpleGrantedAuthority> authorities;
        if (foundUser.getRoles() != null && !foundUser.getRoles().isEmpty()) {
            authorities = foundUser.getRoles().stream()
                    .map(role -> {
                        String roleName = role.getRoleName();
                        String authority = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
                        logger.info("Creating authority: {}", authority);
                        return new SimpleGrantedAuthority(authority);
                    })
                    .collect(Collectors.toList());
        } else {
            authorities = Collections.emptyList();
        }

        logger.info("Final authorities: {}", authorities.stream()
                .map(SimpleGrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        logger.info("User loaded successfully: {}", email);

        return new org.springframework.security.core.userdetails.User(
                foundUser.getEmail(),
                foundUser.getPassword(),
                authorities
        );
    }
}