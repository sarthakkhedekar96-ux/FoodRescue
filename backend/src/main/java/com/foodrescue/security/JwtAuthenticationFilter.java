package com.foodrescue.security;

import com.foodrescue.model.User;
import com.foodrescue.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT Authentication Filter that extracts Bearer token, validates cryptographic signature,
 * and reloads the fresh User entity from MongoDB on each request.
 * Architectural decision:
 * Reloading the user from MongoDB guarantees that:
 * 1. A deleted user loses system access immediately upon deletion (HTTP 401).
 * 2. A demoted or role-altered user has their permissions updated immediately without waiting for token expiration.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (!token.isEmpty()) {
                try {
                    Claims claims = jwtService.parseAndValidateToken(token);
                    String userId = claims.getSubject();

                    if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        // Reload user from MongoDB on each request
                        User freshUser = userRepository.findById(userId).orElse(null);
                        if (freshUser != null) {
                            String ngoId = claims.get("ngoId", String.class);
                            String volunteerId = claims.get("volunteerId", String.class);

                            UserPrincipal principal = new UserPrincipal(
                                    freshUser.getId(),
                                    freshUser.getEmail(),
                                    freshUser.getName(),
                                    freshUser.getRole(),
                                    ngoId,
                                    volunteerId,
                                    freshUser.getPasswordHash()
                            );
                            UsernamePasswordAuthenticationToken authenticationToken =
                                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                            authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                        } else {
                            // Deleted user: clear context
                            SecurityContextHolder.clearContext();
                        }
                    }
                } catch (Exception ex) {
                    // Invalid/tampered/expired token: clear context so request remains unauthenticated
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
