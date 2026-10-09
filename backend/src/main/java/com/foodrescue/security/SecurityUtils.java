package com.foodrescue.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) auth.getPrincipal();
        }
        throw new AccessDeniedException("User is not authenticated");
    }

    public static boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof UserPrincipal;
    }

    public static boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(getCurrentUser().getRole());
    }

    public static boolean isDonor() {
        return "DONOR".equalsIgnoreCase(getCurrentUser().getRole());
    }

    public static boolean isNgo() {
        return "NGO".equalsIgnoreCase(getCurrentUser().getRole());
    }

    public static boolean isVolunteer() {
        return "VOLUNTEER".equalsIgnoreCase(getCurrentUser().getRole());
    }

    public static String getCurrentUserId() {
        return getCurrentUser().getId();
    }
}
