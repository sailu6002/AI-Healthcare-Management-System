package com.healthcare.backend.repository;

import java.sql.Time;
import java.time.LocalTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

/**
 * Data access for doctor_schedules.
 *
 * Plain JdbcTemplate on purpose: the availability tables are created by the
 * explicit Phase 4.2 migration and must not be managed by Hibernate ddl-auto.
 */
@Repository
public class DoctorScheduleDao {

    public record ScheduleRow(
            Long scheduleId,
            Long doctorId,
            int dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            int slotMinutes,
            boolean active) {
    }

    private static final RowMapper<ScheduleRow> MAPPER = (rs, rowNum) -> new ScheduleRow(
            rs.getLong("schedule_id"),
            rs.getLong("doctor_id"),
            rs.getInt("day_of_week"),
            rs.getTime("start_time").toLocalTime(),
            rs.getTime("end_time").toLocalTime(),
            rs.getInt("slot_minutes"),
            rs.getBoolean("active"));

    private final JdbcTemplate jdbcTemplate;

    public DoctorScheduleDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ScheduleRow> findByDoctorAndDay(Long doctorId, int dayOfWeek) {
        return jdbcTemplate.query(
                "SELECT * FROM doctor_schedules "
                        + "WHERE doctor_id = ? AND day_of_week = ? AND active = 1 "
                        + "ORDER BY start_time",
                MAPPER, doctorId, dayOfWeek);
    }

    public List<ScheduleRow> findAllByDoctor(Long doctorId) {
        return jdbcTemplate.query(
                "SELECT * FROM doctor_schedules WHERE doctor_id = ? "
                        + "ORDER BY day_of_week, start_time",
                MAPPER, doctorId);
    }

    public java.util.Optional<ScheduleRow> findById(Long doctorId, Long scheduleId) {
        return jdbcTemplate.query(
                "SELECT * FROM doctor_schedules "
                        + "WHERE doctor_id = ? AND schedule_id = ?",
                MAPPER, doctorId, scheduleId)
                .stream()
                .findFirst();
    }

    public boolean existsActiveByDoctor(Long doctorId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM doctor_schedules "
                        + "WHERE doctor_id = ? AND active = 1",
                Integer.class, doctorId);
        return count != null && count > 0;
    }

    public Long insert(
            Long doctorId,
            int dayOfWeek,
            LocalTime start,
            LocalTime end,
            int slotMinutes,
            boolean active) {

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            var ps = connection.prepareStatement(
                    "INSERT INTO doctor_schedules "
                            + "(doctor_id, day_of_week, start_time, end_time, "
                            + "slot_minutes, active) VALUES (?, ?, ?, ?, ?, ?)",
                    new String[] { "schedule_id" });
            ps.setLong(1, doctorId);
            ps.setInt(2, dayOfWeek);
            ps.setTime(3, Time.valueOf(start));
            ps.setTime(4, Time.valueOf(end));
            ps.setInt(5, slotMinutes);
            ps.setBoolean(6, active);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        return key == null ? null : key.longValue();
    }

    public int delete(Long doctorId, Long scheduleId) {
        return jdbcTemplate.update(
                "DELETE FROM doctor_schedules WHERE doctor_id = ? AND schedule_id = ?",
                doctorId, scheduleId);
    }
}
