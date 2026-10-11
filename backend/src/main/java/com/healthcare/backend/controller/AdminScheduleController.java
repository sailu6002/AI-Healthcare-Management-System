package com.healthcare.backend.controller;

import java.time.Duration;
import java.time.LocalTime;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.dto.ScheduleRequest;
import com.healthcare.backend.dto.TimeOffRequest;
import com.healthcare.backend.exception.ApiException;
import com.healthcare.backend.repository.DoctorRepository;
import com.healthcare.backend.repository.DoctorScheduleDao;
import com.healthcare.backend.repository.DoctorScheduleDao.ScheduleRow;
import com.healthcare.backend.repository.DoctorTimeOffDao;
import com.healthcare.backend.repository.DoctorTimeOffDao.TimeOffRow;

/**
 * Administrative management of a doctor's availability. The whole /api/admin
 * tree already requires ROLE_ADMIN (see SecurityConfig); no doctor may edit
 * their own schedule because there is no user &lt;-&gt; doctor link.
 */
@RestController
@RequestMapping("/api/admin/doctors/{doctorId}")
public class AdminScheduleController {

    private static final int DEFAULT_SLOT_MINUTES = 30;

    private final DoctorScheduleDao scheduleDao;
    private final DoctorTimeOffDao timeOffDao;
    private final DoctorRepository doctorRepository;

    public AdminScheduleController(
            DoctorScheduleDao scheduleDao,
            DoctorTimeOffDao timeOffDao,
            DoctorRepository doctorRepository) {
        this.scheduleDao = scheduleDao;
        this.timeOffDao = timeOffDao;
        this.doctorRepository = doctorRepository;
    }

    // ------------------------------ schedules ------------------------------

    @GetMapping("/schedule")
    public List<ScheduleRow> listSchedules(@PathVariable Long doctorId) {
        requireDoctor(doctorId);
        return scheduleDao.findAllByDoctor(doctorId);
    }

    @PostMapping("/schedule")
    public ResponseEntity<ScheduleRow> addSchedule(
            @PathVariable Long doctorId,
            @RequestBody ScheduleRequest request) {

        requireDoctor(doctorId);

        Integer dayOfWeek = request.getDayOfWeek();
        LocalTime start = request.getStartTime();
        LocalTime end = request.getEndTime();
        int slotMinutes = request.getSlotMinutes() == null
                ? DEFAULT_SLOT_MINUTES
                : request.getSlotMinutes();

        if (dayOfWeek == null || dayOfWeek < 1 || dayOfWeek > 7) {
            throw new ApiException(
                    "dayOfWeek must be between 1 (Monday) and 7 (Sunday).",
                    400,
                    "validation_error");
        }
        if (start == null || end == null) {
            throw new ApiException(
                    "startTime and endTime are required.",
                    400,
                    "validation_error");
        }
        if (!start.isBefore(end)) {
            throw new ApiException(
                    "startTime must be before endTime.",
                    400,
                    "validation_error");
        }
        if (slotMinutes <= 0
                || Duration.between(start, end).toMinutes() < slotMinutes) {
            throw new ApiException(
                    "slotMinutes must be positive and fit within the interval.",
                    400,
                    "validation_error");
        }

        try {
            Long id = scheduleDao.insert(
                    doctorId, dayOfWeek, start, end, slotMinutes, true);

            ScheduleRow created = scheduleDao.findById(doctorId, id)
                    .orElseThrow(() -> new ApiException(
                            "Schedule could not be created.",
                            500,
                            "server_error"));

            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(
                    "This schedule block already exists for the doctor.",
                    409,
                    "duplicate_schedule");
        }
    }

    @DeleteMapping("/schedule/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable Long doctorId, @PathVariable Long scheduleId) {

        requireDoctor(doctorId);

        if (scheduleDao.delete(doctorId, scheduleId) == 0) {
            throw new ApiException(
                    "Schedule not found.", 404, "not_found");
        }

        return ResponseEntity.noContent().build();
    }

    // ------------------------------ time off -------------------------------

    @GetMapping("/time-off")
    public List<TimeOffRow> listTimeOff(@PathVariable Long doctorId) {
        requireDoctor(doctorId);
        return timeOffDao.findAllByDoctor(doctorId);
    }

    @PostMapping("/time-off")
    public ResponseEntity<TimeOffRow> addTimeOff(
            @PathVariable Long doctorId,
            @RequestBody TimeOffRequest request) {

        requireDoctor(doctorId);

        if (request.getOffDate() == null) {
            throw new ApiException(
                    "offDate is required.", 400, "validation_error");
        }

        LocalTime start = request.getStartTime();
        LocalTime end = request.getEndTime();

        // Either a full day (both null) or an explicit, ordered interval.
        if ((start == null) != (end == null)) {
            throw new ApiException(
                    "Provide both startTime and endTime, or neither for a "
                            + "full day.",
                    400,
                    "validation_error");
        }
        if (start != null && !start.isBefore(end)) {
            throw new ApiException(
                    "startTime must be before endTime.",
                    400,
                    "validation_error");
        }

        Long id = timeOffDao.insert(
                doctorId, request.getOffDate(), start, end, request.getReason());

        TimeOffRow created = timeOffDao.findById(doctorId, id)
                .orElseThrow(() -> new ApiException(
                        "Time off could not be created.", 500, "server_error"));

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/time-off/{timeOffId}")
    public ResponseEntity<Void> deleteTimeOff(
            @PathVariable Long doctorId, @PathVariable Long timeOffId) {

        requireDoctor(doctorId);

        if (timeOffDao.delete(doctorId, timeOffId) == 0) {
            throw new ApiException("Time off not found.", 404, "not_found");
        }

        return ResponseEntity.noContent().build();
    }

    private void requireDoctor(Long doctorId) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ApiException("Doctor not found.", 404, "doctor_not_found");
        }
    }
}
