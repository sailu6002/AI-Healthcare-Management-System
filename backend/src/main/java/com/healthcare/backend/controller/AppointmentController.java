package com.healthcare.backend.controller;
import java.security.Principal;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.dto.AppointmentRequest;
import com.healthcare.backend.dto.AppointmentView;
import com.healthcare.backend.model.Appointment;
import com.healthcare.backend.service.AppointmentService;

@RestController
@RequestMapping("/api/appointments")

public class AppointmentController {
    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    // Patient books a slot. Patient identity comes from the JWT principal.
    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<AppointmentView> createAppointment(
            @RequestBody AppointmentRequest request,
            Principal principal) {

        AppointmentView booking =
                appointmentService.createBooking(principal.getName(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    // Patient's own appointment history.
    @GetMapping("/mine")
    @PreAuthorize("hasRole('PATIENT')")
    public List<AppointmentView> getMyAppointments(Principal principal) {
        return appointmentService.getMyAppointments(principal.getName());
    }

    // Patient cancels their own appointment; ADMIN may cancel any.
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT','ADMIN')")
    public AppointmentView cancelAppointment(
            @PathVariable Long id,
            Authentication authentication,
            Principal principal) {

        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        return appointmentService.cancel(principal.getName(), admin, id);
    }

    // ------------------------------------------------------------------
    // Administrative endpoints
    // ------------------------------------------------------------------

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id) {

        Optional<Appointment> appointment = appointmentService.getAppointmentById(id);

        return appointment.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable Long id,
            @RequestBody Appointment appointmentDetails) {

        Optional<Appointment> updatedAppointment =
                appointmentService.updateAppointment(id, appointmentDetails);

        return updatedAppointment.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {

        appointmentService.deleteAppointment(id);

        return ResponseEntity.noContent().build();
    }

}
