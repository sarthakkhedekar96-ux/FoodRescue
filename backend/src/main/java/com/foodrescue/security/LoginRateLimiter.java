package com.foodrescue.security;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class LoginRateLimiter {
    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MILLIS = 15 * 60 * 1000L; // 15 minutes

    private final ConcurrentHashMap<String, List<Long>> attempts = new ConcurrentHashMap<>();

    private String buildKey(String email, String ip) {
        String safeEmail = (email != null && !email.isBlank()) ? email.toLowerCase().trim() : "anonymous";
        String safeIp = (ip != null && !ip.isBlank()) ? ip.trim() : "unknown";
        return safeEmail + ":" + safeIp;
    }

    public boolean isBlocked(String email, String ip) {
        long cutoff = System.currentTimeMillis() - WINDOW_MILLIS;
        String key = buildKey(email, ip);
        return isKeyBlocked(key, cutoff);
    }

    private boolean isKeyBlocked(String key, long cutoff) {
        if (key == null || key.isBlank()) return false;
        List<Long> timestamps = attempts.get(key);
        if (timestamps == null) return false;
        long count = timestamps.stream().filter(t -> t > cutoff).count();
        return count >= MAX_ATTEMPTS;
    }

    public void recordFailedAttempt(String email, String ip) {
        long now = System.currentTimeMillis();
        long cutoff = now - WINDOW_MILLIS;
        String key = buildKey(email, ip);

        attempts.compute(key, (k, list) -> {
            if (list == null) {
                list = new CopyOnWriteArrayList<>();
            }
            list.removeIf(t -> t <= cutoff);
            list.add(now);
            return list;
        });
    }

    public void clear(String email, String ip) {
        String key = buildKey(email, ip);
        attempts.remove(key);
    }
}
