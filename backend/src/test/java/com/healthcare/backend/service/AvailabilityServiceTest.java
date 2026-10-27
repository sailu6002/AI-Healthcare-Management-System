package com.healthcare.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.healthcare.backend.dto.AvailabilitySlot;
import com.healthcare.backend.exception.ApiException;
import com.healthcare.backend.model.Appointment;
import com.healthcare.backend.repository.AppointmentRepository;
import com.healthcare.backend.repository.DoctorRepository;
import com.healthcare.backend.repository.DoctorScheduleDao;
import com.healthcare.backend.repository.DoctorScheduleDao.ScheduleRow;
import com.healthcare.backend.repository.DoctorTimeOffDao;
import com.healthcare.backend.repository.DoctorTimeOffDao.TimeOffRow;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    private static final ZoneId CLINIC = ZoneId.of("Asia/Kolkata");
    private static final Long DOCTOR_ID = 7L;

    @Mock
    private DoctorScheduleDao scheduleDao;

    @Mock
    private DoctorTimeOffDao timeOffDao;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    private AvailabilityService service;

    private LocalDate futureDate;

    @BeforeEach
    void setUp() {
        service = new AvailabilityService(
                scheduleDao, timeOffDao, appointmentRepository,
                doctorRepository, "Asia/Kolkata");
        futureDate = LocalDate.now(CLINIC).plusDays(7);
    }

    private ScheduleRow schedule(LocalTime start, LocalTime end, int minutes) {
        return new ScheduleRow(1L, DOCTOR_ID, 1, start, end, minutes, true);
    }

    private Appointment booked(LocalTime time) {
        Appointment appointment = new Appointment();
        appointment.setDoctorId(DOCTOR_ID);
        appointment.setAppointmentDate(futureDate);
        appointment.setAppointmentTime(time);
        appointment.setStatus("BOOKED");
        return appointment;
    }

    @Test
    void noConfiguredScheduleMeansNoSlots() {
        when(doctorRepository.existsById(DOCTOR_ID)).thenReturn(true);
        when(scheduleDao.findByDoctorAndDay(eq(DOCTOR_ID), anyInt()))
                .thenReturn(List.of());

        assertThat(service.getAvailability(DOCTOR_ID, futureDate)).isEmpty();
    }

    @Test
    void derivesSlotsFromScheduleInThirtyMinuteSteps() {
        when(doctorRepository.existsById(DOCTOR_ID)).thenReturn(true);
        when(scheduleDao.findByDoctorAndDay(eq(DOCTOR_ID), anyInt()))
                .thenReturn(List.of(schedule(
                        LocalTime.of(9, 0), LocalTime.of(10, 0), 30)));

        List<AvailabilitySlot> slots =
                service.getAvailability(DOCTOR_ID, futureDate);

        assertThat(slots).hasSize(2);
        assertThat(slots.get(0).getStart()).isEqualTo(LocalTime.of(9, 0));
        assertThat(slots.get(0).getEnd()).isEqualTo(LocalTime.of(9, 30));
        assertThat(slots.get(1).getStart()).isEqualTo(LocalTime.of(9, 30));
    }

    @Test
    void removesSlotsCoveredByTimeOff() {
        when(doctorRepository.existsById(DOCTOR_ID)).thenReturn(true);
        when(scheduleDao.findByDoctorAndDay(eq(DOCTOR_ID), anyInt()))
                .thenReturn(List.of(schedule(
                        LocalTime.of(9, 0), LocalTime.of(10, 0), 30)));
        when(timeOffDao.findByDoctorAndDate(eq(DOCTOR_ID), eq(futureDate)))
                .thenReturn(List.of(new TimeOffRow(
                        1L, DOCTOR_ID, futureDate,
                        LocalTime.of(9, 0), LocalTime.of(9, 30), "break")));

        List<AvailabilitySlot> slots =
                service.getAvailability(DOCTOR_ID, futureDate);

        assertThat(slots).extracting(AvailabilitySlot::getStart)
                .containsExactly(LocalTime.of(9, 30));
    }

    @Test
    void removesAlreadyBookedSlots() {
        when(doctorRepository.existsById(DOCTOR_ID)).thenReturn(true);
        when(scheduleDao.findByDoctorAndDay(eq(DOCTOR_ID), anyInt()))
                .thenReturn(List.of(schedule(
                        LocalTime.of(9, 0), LocalTime.of(10, 0), 30)));
        when(appointmentRepository
                .findByDoctorIdAndAppointmentDateAndStatus(
                        eq(DOCTOR_ID), eq(futureDate), eq("BOOKED")))
                .thenReturn(List.of(booked(LocalTime.of(9, 30))));

        List<AvailabilitySlot> slots =
                service.getAvailability(DOCTOR_ID, futureDate);

        assertThat(slots).extracting(AvailabilitySlot::getStart)
                .containsExactly(LocalTime.of(9, 0));
    }

    @Test
    void pastDatesHaveNoSlots() {
        LocalDate yesterday = LocalDate.now(CLINIC).minusDays(1);
        when(doctorRepository.existsById(DOCTOR_ID)).thenReturn(true);
        when(scheduleDao.findByDoctorAndDay(eq(DOCTOR_ID), anyInt()))
                .thenReturn(List.of(schedule(
                        LocalTime.of(9, 0), LocalTime.of(10, 0), 30)));

        assertThat(service.getAvailability(DOCTOR_ID, yesterday)).isEmpty();
    }

    @Test
    void validateRejectsTimeThatIsNotAnAlignedSlot() {
        when(doctorRepository.existsById(DOCTOR_ID)).thenReturn(true);
        when(scheduleDao.findByDoctorAndDay(eq(DOCTOR_ID), anyInt()))
                .thenReturn(List.of(schedule(
                        LocalTime.of(9, 0), LocalTime.of(10, 0), 30)));

        assertThatThrownBy(() -> service.validateAvailableSlot(
                DOCTOR_ID, futureDate, LocalTime.of(9, 15)))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> assertThat(((ApiException) ex).getCode())
                        .isEqualTo("invalid_slot"));
    }

    @Test
    void validateReportsConflictForAlreadyBookedSlot() {
        when(doctorRepository.existsById(DOCTOR_ID)).thenReturn(true);
        when(scheduleDao.findByDoctorAndDay(eq(DOCTOR_ID), anyInt()))
                .thenReturn(List.of(schedule(
                        LocalTime.of(9, 0), LocalTime.of(10, 0), 30)));
        when(appointmentRepository
                .findByDoctorIdAndAppointmentDateAndStatus(
                        anyLong(), eq(futureDate), eq("BOOKED")))
                .thenReturn(List.of(booked(LocalTime.of(9, 30))));

        assertThatThrownBy(() -> service.validateAvailableSlot(
                DOCTOR_ID, futureDate, LocalTime.of(9, 30)))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    assertThat(((ApiException) ex).getStatus()).isEqualTo(409);
                    assertThat(((ApiException) ex).getCode())
                            .isEqualTo("slot_conflict");
                });
    }
}
