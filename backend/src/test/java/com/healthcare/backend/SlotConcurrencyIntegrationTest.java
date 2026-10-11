package com.healthcare.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Proves the database-level guarantee that the booking flow relies on:
 * the generated key {@code active_slot_key} plus {@code uq_active_slot} makes
 * it impossible for two active (BOOKED) rows to share one doctor/date/time,
 * even when the inserts run concurrently.
 *
 * It uses a throwaway table with the exact same column design as the real
 * appointments table, so the live data is never touched.
 */
@SpringBootTest
class SlotConcurrencyIntegrationTest {

    private static final String TABLE = "_phase42_race_test";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void tearDown() {
        jdbcTemplate.execute("DROP TABLE IF EXISTS " + TABLE);
    }

    private void createRaceTable() {
        jdbcTemplate.execute("DROP TABLE IF EXISTS " + TABLE);
        jdbcTemplate.execute(
                "CREATE TABLE " + TABLE + " ("
                        + "id BIGINT AUTO_INCREMENT PRIMARY KEY, "
                        + "doctor_id BIGINT NOT NULL, "
                        + "appt_date DATE NOT NULL, "
                        + "appt_time TIME NOT NULL, "
                        + "status VARCHAR(20) NOT NULL, "
                        + "active_slot_key VARCHAR(120) GENERATED ALWAYS AS ("
                        + "CASE WHEN status = 'BOOKED' "
                        + "THEN CONCAT(doctor_id, '|', appt_date, '|', appt_time) "
                        + "ELSE NULL END) STORED, "
                        + "UNIQUE KEY uq_active (active_slot_key)"
                        + ") ENGINE=InnoDB");
    }

    private void insertBooking(String status) {
        jdbcTemplate.update(
                "INSERT INTO " + TABLE
                        + " (doctor_id, appt_date, appt_time, status) "
                        + "VALUES (1, '2030-01-01', '09:00:00', ?)",
                status);
    }

    @Test
    void onlyOneConcurrentActiveBookingForTheSameSlotCanWin() throws Exception {
        createRaceTable();

        int attempts = 5;
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        AtomicInteger conflicts = new AtomicInteger();

        ExecutorService pool = Executors.newFixedThreadPool(attempts);
        try {
            for (int i = 0; i < attempts; i++) {
                pool.submit(() -> {
                    try {
                        start.await();
                        insertBooking("BOOKED");
                        successes.incrementAndGet();
                    } catch (DuplicateKeyException ex) {
                        conflicts.incrementAndGet();
                    } catch (InterruptedException ex) {
                        Thread.currentThread().interrupt();
                    }
                });
            }

            start.countDown();
            pool.shutdown();
            assertThat(pool.awaitTermination(30, TimeUnit.SECONDS)).isTrue();
        } finally {
            pool.shutdownNow();
        }

        assertThat(successes.get()).isEqualTo(1);
        assertThat(conflicts.get()).isEqualTo(attempts - 1);

        Integer active = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + TABLE + " WHERE status = 'BOOKED'",
                Integer.class);
        assertThat(active).isEqualTo(1);
    }

    @Test
    void cancelledRowsDoNotOccupyTheSlot() {
        createRaceTable();

        insertBooking("CANCELLED");
        insertBooking("CANCELLED");
        insertBooking("BOOKED");

        assertThat(org.junit.jupiter.api.Assertions.assertThrows(
                DuplicateKeyException.class,
                () -> insertBooking("BOOKED"))).isNotNull();

        Integer cancellations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + TABLE + " WHERE status = 'CANCELLED'",
                Integer.class);
        assertThat(cancellations).isEqualTo(2);

        Integer active = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + TABLE + " WHERE status = 'BOOKED'",
                Integer.class);
        assertThat(active).isEqualTo(1);
    }
}
