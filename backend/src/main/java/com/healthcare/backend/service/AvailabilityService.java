package com.healthcare.backend.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.healthcare.backend.dto.AvailabilitySlot;
import com.healthcare.backend.exception.ApiException;
import com.healthcare.backend.model.Appointment;
import com.healthcare.backend.repository.AppointmentRepository;
import com.healthcare.backend.repository.DoctorRepository;
import com.healthcare.backend.repository.DoctorScheduleDao;
import com.healthcare.backend.repository.DoctorScheduleDao.ScheduleRow;
import com.healthcare.backend.repository.DoctorTimeOffDao;
import com.healthcare.backend.repository.DoctorTimeOffDao.TimeOffRow;

/**
 * Derives genuinely bookable slots from doctor_schedules, minus time off and
 * existing active (BOOKED) appointments. Slots are never stored.
 *
 * All times are naive clinic-local (Asia/Kolkata by default) and are never
 * converted, matching the DATE/TIME columns.
 */
@Service
public class AvailabilityService {

    private final DoctorScheduleDao scheduleDao;
    private final DoctorTimeOffDao timeOffDao;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final ZoneId clinicZone;

    public AvailabilityService(
            DoctorScheduleDao scheduleDao,
            DoctorTimeOffDao timeOffDao,
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            @Value("${clinic.timezone:Asia/Kolkata}") String clinicTimezone) {

        this.scheduleDao = scheduleDao;
        this.timeOffDao = timeOffDao;
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.clinicZone = ZoneId.of(clinicTimezone);
    }

    public List<AvailabilitySlot> getAvailability(Long doctorId, LocalDate date) {

        if (doctorId == null) {
            throw new ApiException("A doctor is required.", 400, "validation_error");
        }
        if (date == null) {
            throw new ApiException("A date is required.", 400, "validation_error");
        }
        if (!doctorRepository.existsById(doctorId)) {
            throw new ApiException("Doctor not found.", 404, "doctor_not_found");
        }

        List<ScheduleRow> schedules =
                scheduleDao.findByDoctorAndDay(doctorId, date.getDayOfWeek().getValue());

        // No configured schedule for that weekday -> genuinely no slots.
        if (schedules.isEmpty()) {
            return List.of();
        }

        List<TimeOffRow> timeOff = timeOffDao.findByDoctorAndDate(doctorId, date);
        Set<LocalTime> booked = bookedSlots(doctorId, date);

        LocalDate today = LocalDate.now(clinicZone);
        LocalTime now = LocalTime.now(clinicZone);
        boolean pastDate = date.isBefore(today);

        List<AvailabilitySlot> slots = new ArrayList<>();

        for (ScheduleRow schedule : schedules) {
            int step = schedule.slotMinutes();
            LocalTime cursor = schedule.startTime();

            while (!cursor.plusMinutes(step).isAfter(schedule.endTime())) {
                LocalTime end = cursor.plusMinutes(step);

                boolean inPast = pastDate
                        || (date.isEqual(today) && !cursor.isAfter(now));

                if (!inPast
                        && !overlapsTimeOff(timeOff, cursor, end)
                        && !booked.contains(cursor)) {
                    slots.add(new AvailabilitySlot(cursor, end));
                }

                cursor = end;
            }
        }

        return slots;
    }

    /**
     * Validates that {@code start} is exactly a real, currently available slot.
     * Throws an {@link ApiException} otherwise (invalid slot / unavailable /
     * conflict). Booking still relies on the database unique key to win races.
     */
    public void validateAvailableSlot(
            Long doctorId, LocalDate date, LocalTime start) {

        if (doctorId == null || date == null || start == null) {
            throw new ApiException(
                    "Doctor, date and start time are required.",
                    400,
                    "validation_error");
        }

        if (!doctorRepository.existsById(doctorId)) {
            throw new ApiException("Doctor not found.", 404, "doctor_not_found");
        }

        LocalDate today = LocalDate.now(clinicZone);
        LocalTime now = LocalTime.now(clinicZone);

        if (date.isBefore(today)
                || (date.isEqual(today) && !start.isAfter(now))) {
            throw new ApiException(
                    "Appointments cannot be booked in the past.",
                    400,
                    "invalid_slot");
        }

        List<ScheduleRow> schedules =
                scheduleDao.findByDoctorAndDay(doctorId, date.getDayOfWeek().getValue());

        ScheduleRow matching = schedules.stream()
                .filter(schedule -> isAligned(schedule, start))
                .findFirst()
                .orElseThrow(() -> new ApiException(
                        "The selected time is not a valid slot for this doctor.",
                        400,
                        "invalid_slot"));

        LocalTime end = start.plusMinutes(matching.slotMinutes());

        List<TimeOffRow> timeOff = timeOffDao.findByDoctorAndDate(doctorId, date);
        if (overlapsTimeOff(timeOff, start, end)) {
            throw new ApiException(
                    "The selected time is not available.",
                    400,
                    "slot_unavailable");
        }

        if (bookedSlots(doctorId, date).contains(start)) {
            throw new ApiException(
                    "That slot has already been booked. Please choose another.",
                    409,
                    "slot_conflict");
        }
    }

    private boolean isAligned(ScheduleRow schedule, LocalTime start) {
        if (start.isBefore(schedule.startTime())) {
            return false;
        }
        LocalTime end = start.plusMinutes(schedule.slotMinutes());
        if (end.isAfter(schedule.endTime())) {
            return false;
        }
        long minutes = Duration.between(schedule.startTime(), start).toMinutes();
        return minutes % schedule.slotMinutes() == 0;
    }

    private boolean overlapsTimeOff(
            List<TimeOffRow> timeOff, LocalTime start, LocalTime end) {

        for (TimeOffRow off : timeOff) {
            LocalTime offStart = off.startTime() != null ? off.startTime() : LocalTime.MIN;
            LocalTime offEnd = off.endTime() != null ? off.endTime() : LocalTime.MAX;
            if (offStart.isBefore(end) && start.isBefore(offEnd)) {
                return true;
            }
        }
        return false;
    }

    private Set<LocalTime> bookedSlots(Long doctorId, LocalDate date) {
        return appointmentRepository
                .findByDoctorIdAndAppointmentDateAndStatus(doctorId, date, "BOOKED")
                .stream()
                .map(Appointment::getAppointmentTime)
                .collect(Collectors.toSet());
    }
}
