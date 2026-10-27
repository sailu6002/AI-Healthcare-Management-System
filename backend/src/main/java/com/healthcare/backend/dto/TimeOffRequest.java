package com.healthcare.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/** Admin request to block part or all of a doctor's day. */
public class TimeOffRequest {

    private LocalDate offDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String reason;

    public TimeOffRequest() {
    }

    public LocalDate getOffDate() {
        return offDate;
    }

    public void setOffDate(LocalDate offDate) {
        this.offDate = offDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
