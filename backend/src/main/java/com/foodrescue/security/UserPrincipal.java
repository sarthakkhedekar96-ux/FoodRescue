package com.foodrescue.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserPrincipal implements UserDetails {
    private final String id;
    private final String email;
    private final String name;
    private final String role;
    private final String ngoId;
    private final String volunteerId;
    private final String passwordHash;

    public UserPrincipal(String id, String email, String name, String role, String ngoId, String volunteerId, String passwordHash) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role != null ? role.toUpperCase() : "DONOR";
        this.ngoId = ngoId;
        this.volunteerId = volunteerId;
        this.passwordHash = passwordHash;
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public String getNgoId() {
        return ngoId;
    }

    public String getVolunteerId() {
        return volunteerId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return passwordHash != null ? passwordHash : "";
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
