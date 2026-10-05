package com.apisentinel.service;

import com.apisentinel.dto.AuthRequest;
import com.apisentinel.dto.AuthResponse;
import com.apisentinel.dto.RegisterRequest;
import com.apisentinel.entity.Organization;
import com.apisentinel.entity.Role;
import com.apisentinel.entity.User;
import com.apisentinel.repository.OrganizationRepository;
import com.apisentinel.repository.UserRepository;
import com.apisentinel.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    @Transactional
    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        auditService.log(user.getUsername(), "USER_LOGIN", "AUTH", null, "SUCCESS", "User logged in successfully");

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .organizationName(user.getOrganization() != null ? user.getOrganization().getName() : "Default Org")
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        Organization org = null;
        if (request.getOrganizationName() != null && !request.getOrganizationName().isBlank()) {
            org = organizationRepository.findByName(request.getOrganizationName())
                    .orElseGet(() -> organizationRepository.save(
                            Organization.builder()
                                    .name(request.getOrganizationName())
                                    .slug(request.getOrganizationName().toLowerCase().replaceAll("[^a-z0-9]", "-"))
                                    .tier("ENTERPRISE")
                                    .build()
                    ));
        } else {
            org = organizationRepository.findAll().stream().findFirst().orElse(null);
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(request.getRole() != null ? request.getRole() : Role.DEVELOPER)
                .organization(org)
                .enabled(true)
                .build();

        userRepository.save(user);

        String token = tokenProvider.generateTokenFromUsername(user.getUsername(), user.getRole().name());

        auditService.log(user.getUsername(), "USER_REGISTER", "AUTH", null, "SUCCESS", "User account registered");

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .organizationName(org != null ? org.getName() : "Default Org")
                .build();
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName())
                .or(() -> userRepository.findByEmail(auth.getName()))
                .orElse(null);
    }
}
