package com.healthcare.backend.dto;

import java.time.LocalTime;

/** A single bookable slot returned by the availability endpoint. */
public class AvailabilitySlot {

    private final LocalTime start;
    private final LocalTime end;

    public AvailabilitySlot(LocalTime start, LocalTime end) {
        this.start = start;
        this.end = end;
    }

    public LocalTime getStart() {
        return start;
    }

    public LocalTime getEnd() {
        return end;
    }
}
