package com.healthcare.backend.repository;

import java.sql.Date;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

/**
 * Data access for doctor_time_off.
 *
 * Plain JdbcTemplate on purpose: the availability tables are created by the
 * explicit Phase 4.2 migration and must not be managed by Hibernate ddl-auto.
 */
@Repository
public class DoctorTimeOffDao {

    public record TimeOffRow(
            Long timeOffId,
            Long doctorId,
            LocalDate offDate,
            LocalTime startTime,
            LocalTime endTime,
            String reason) {
    }

    private static final RowMapper<TimeOffRow> MAPPER = (rs, rowNum) -> {
        Time start = rs.getTime("start_time");
        Time end = rs.getTime("end_time");
        return new TimeOffRow(
                rs.getLong("time_off_id"),
                rs.getLong("doctor_id"),
                rs.getDate("off_date").toLocalDate(),
                start == null ? null : start.toLocalTime(),
                end == null ? null : end.toLocalTime(),
                rs.getString("reason"));
    };

    private final JdbcTemplate jdbcTemplate;

    public DoctorTimeOffDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TimeOffRow> findByDoctorAndDate(Long doctorId, LocalDate date) {
        return jdbcTemplate.query(
                "SELECT * FROM doctor_time_off WHERE doctor_id = ? AND off_date = ?",
                MAPPER, doctorId, Date.valueOf(date));
    }

    public List<TimeOffRow> findAllByDoctor(Long doctorId) {
        return jdbcTemplate.query(
                "SELECT * FROM doctor_time_off WHERE doctor_id = ? ORDER BY off_date",
                MAPPER, doctorId);
    }

    public java.util.Optional<TimeOffRow> findById(Long doctorId, Long timeOffId) {
        return jdbcTemplate.query(
                "SELECT * FROM doctor_time_off "
                        + "WHERE doctor_id = ? AND time_off_id = ?",
                MAPPER, doctorId, timeOffId)
                .stream()
                .findFirst();
    }

    public Long insert(
            Long doctorId,
            LocalDate offDate,
            LocalTime startTime,
            LocalTime endTime,
            String reason) {

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            var ps = connection.prepareStatement(
                    "INSERT INTO doctor_time_off "
                            + "(doctor_id, off_date, start_time, end_time, reason) "
                            + "VALUES (?, ?, ?, ?, ?)",
                    new String[] { "time_off_id" });
            ps.setLong(1, doctorId);
            ps.setDate(2, Date.valueOf(offDate));
            if (startTime == null) {
                ps.setNull(3, java.sql.Types.TIME);
            } else {
                ps.setTime(3, Time.valueOf(startTime));
            }
            if (endTime == null) {
                ps.setNull(4, java.sql.Types.TIME);
            } else {
                ps.setTime(4, Time.valueOf(endTime));
            }
            ps.setString(5, reason);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        return key == null ? null : key.longValue();
    }

    public int delete(Long doctorId, Long timeOffId) {
        return jdbcTemplate.update(
                "DELETE FROM doctor_time_off WHERE doctor_id = ? AND time_off_id = ?",
                doctorId, timeOffId);
    }
}
