package com.foodrescue.model;

import java.time.Instant;

public class StatusHistory {
    private String status;
    private Instant time;

    public StatusHistory() {}

    public StatusHistory(String status, Instant time) {
        this.status = status;
        this.time = time;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getTime() {
        return time;
    }

    public void setTime(Instant time) {
        this.time = time;
    }
}
