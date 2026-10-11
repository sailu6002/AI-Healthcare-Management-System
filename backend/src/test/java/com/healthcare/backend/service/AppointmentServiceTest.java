package com.healthcare.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.healthcare.backend.dto.AppointmentRequest;
import com.healthcare.backend.exception.ApiException;
import com.healthcare.backend.model.Appointment;
import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.model.Patient;
import com.healthcare.backend.model.User;
import com.healthcare.backend.repository.AppointmentRepository;
import com.healthcare.backend.repository.DoctorRepository;
import com.healthcare.backend.repository.PatientRepository;
import com.healthcare.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    private static final String EMAIL = "patient@example.com";

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AvailabilityService availabilityService;

    @InjectMocks
    private AppointmentService appointmentService;

    private User userWithId(long userId) {
        User user = new User("Patient One", EMAIL, "hash", "PATIENT");
        user.setUserId(userId);
        return user;
    }

    private Patient patientWithId(long patientId, Long userId) {
        Patient patient = new Patient();
        patient.setPatientId(patientId);
        patient.setUserId(userId);
        return patient;
    }

    private AppointmentRequest request() {
        AppointmentRequest request = new AppointmentRequest();
        request.setDoctorId(2L);
        request.setDate(LocalDate.now().plusDays(7));
        request.setStartTime(LocalTime.of(10, 0));
        return request;
    }

    @Test
    void bookingWithoutPatientProfileIsRejected() {
        when(userRepository.findByEmail(EMAIL))
                .thenReturn(Optional.of(userWithId(1L)));
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                appointmentService.createBooking(EMAIL, request()))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    assertThat(((ApiException) ex).getStatus()).isEqualTo(409);
                    assertThat(((ApiException) ex).getCode())
                            .isEqualTo("profile_required");
                });
    }

    @Test
    void bookingIgnoresPatientIdAndUsesAuthenticatedPatient() {
        when(userRepository.findByEmail(EMAIL))
                .thenReturn(Optional.of(userWithId(1L)));
        when(patientRepository.findByUserId(1L))
                .thenReturn(Optional.of(patientWithId(50L, 1L)));
        doNothing().when(availabilityService)
                .validateAvailableSlot(any(), any(), any());

        Doctor doctor = new Doctor();
        doctor.setDoctorId(2L);
        doctor.setFullName("Dr. Two");
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor));

        when(appointmentRepository.saveAndFlush(any(Appointment.class)))
                .thenAnswer(invocation -> {
                    Appointment saved = invocation.getArgument(0);
                    saved.setAppointmentId(100L);
                    return saved;
                });

        appointmentService.createBooking(EMAIL, request());

        org.mockito.ArgumentCaptor<Appointment> captor =
                org.mockito.ArgumentCaptor.forClass(Appointment.class);
        org.mockito.Mockito.verify(appointmentRepository)
                .saveAndFlush(captor.capture());

        assertThat(captor.getValue().getPatientId()).isEqualTo(50L);
        assertThat(captor.getValue().getStatus()).isEqualTo("BOOKED");
    }

    @Test
    void duplicateActiveSlotFromDatabaseBecomesConflict() {
        when(userRepository.findByEmail(EMAIL))
                .thenReturn(Optional.of(userWithId(1L)));
        when(patientRepository.findByUserId(1L))
                .thenReturn(Optional.of(patientWithId(50L, 1L)));
        doNothing().when(availabilityService)
                .validateAvailableSlot(any(), any(), any());

        Doctor doctor = new Doctor();
        doctor.setDoctorId(2L);
        when(doctorRepository.findById(2L)).thenReturn(Optional.of(doctor));

        when(appointmentRepository.saveAndFlush(any(Appointment.class)))
                .thenThrow(new DataIntegrityViolationException(
                        "uq_active_slot"));

        assertThatThrownBy(() ->
                appointmentService.createBooking(EMAIL, request()))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    assertThat(((ApiException) ex).getStatus()).isEqualTo(409);
                    assertThat(((ApiException) ex).getCode())
                            .isEqualTo("slot_conflict");
                });
    }

    @Test
    void patientCannotCancelSomeoneElsesAppointment() {
        Appointment existing = new Appointment();
        existing.setAppointmentId(5L);
        existing.setPatientId(99L);
        existing.setDoctorId(2L);
        existing.setStatus("BOOKED");
        when(appointmentRepository.findById(5L))
                .thenReturn(Optional.of(existing));

        when(userRepository.findByEmail(EMAIL))
                .thenReturn(Optional.of(userWithId(1L)));
        when(patientRepository.findByUserId(1L))
                .thenReturn(Optional.of(patientWithId(50L, 1L)));

        assertThatThrownBy(() ->
                appointmentService.cancel(EMAIL, false, 5L))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    assertThat(((ApiException) ex).getStatus()).isEqualTo(403);
                    assertThat(((ApiException) ex).getCode())
                            .isEqualTo("forbidden");
                });
    }

    @Test
    void cancellationOfMissingAppointmentReturnsNotFound() {
        when(appointmentRepository.findById(anyLong()))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                appointmentService.cancel(EMAIL, true, 404L))
                .isInstanceOf(ApiException.class)
                .satisfies(ex -> {
                    assertThat(((ApiException) ex).getStatus()).isEqualTo(404);
                    assertThat(((ApiException) ex).getCode())
                            .isEqualTo("not_found");
                });
    }
}
