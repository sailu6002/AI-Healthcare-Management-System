package com.healthcare.backend.service;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.repository.DoctorRepository;

class DoctorServiceUnitTest {

    private DoctorRepository doctorRepository;
    private DoctorService doctorService;

    private List<Doctor> mockDoctorList;
    private List<String> mockDistinctSpecs;

    private Doctor doc1;
    private Doctor doc2;
    private Doctor doc3;

    @BeforeEach
    void setUp() {
        mockDoctorList = new ArrayList<>();
        mockDistinctSpecs = new ArrayList<>();

        doc1 = new Doctor();
        doc1.setDoctorId(1L);
        doc1.setFullName("Dr. Arun Kumar");
        doc1.setSpecialization("Cardiology");
        doc1.setEmail("arun@gmail.com");

        doc2 = new Doctor();
        doc2.setDoctorId(2L);
        doc2.setFullName("Dr. Priya Sharma");
        doc2.setSpecialization("Dermatology");
        doc2.setEmail("priya@gmail.com");

        doc3 = new Doctor();
        doc3.setDoctorId(3L);
        doc3.setFullName("Dr. Rahul Verma");
        doc3.setSpecialization("Neurology");
        doc3.setEmail("rahul@gmail.com");

        mockDoctorList.add(doc1);
        mockDoctorList.add(doc2);
        mockDoctorList.add(doc3);

        // Standard Java Reflection Proxy to bypass Windows pipe restrictions
        doctorRepository = (DoctorRepository) Proxy.newProxyInstance(
                DoctorRepository.class.getClassLoader(),
                new Class<?>[]{DoctorRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findDistinctSpecializations".equals(name)) {
                        return mockDistinctSpecs;
                    }
                    if ("findAll".equals(name)) {
                        return mockDoctorList;
                    }
                    if ("findBySpecializationIgnoreCase".equals(name)) {
                        String spec = (String) args[0];
                        return mockDoctorList.stream()
                                .filter(d -> spec.equalsIgnoreCase(d.getSpecialization()))
                                .toList();
                    }
                    if ("findByEmail".equals(name)) {
                        String email = (String) args[0];
                        return mockDoctorList.stream()
                                .filter(d -> email.equalsIgnoreCase(d.getEmail()))
                                .findFirst();
                    }
                    if ("findByFullNameIgnoreCase".equals(name)) {
                        String fullName = (String) args[0];
                        return mockDoctorList.stream()
                                .filter(d -> fullName.equalsIgnoreCase(d.getFullName()))
                                .findFirst();
                    }
                    if ("save".equals(name)) {
                        return args[0];
                    }
                    return null;
                }
        );

        doctorService = new DoctorService(doctorRepository);
    }

    @Test
    @DisplayName("DoctorService returns distinct clinical specializations from repository")
    void testGetSpecializationsFromRepo() {
        mockDistinctSpecs.add("Cardiology");
        mockDistinctSpecs.add("Dermatology");
        mockDistinctSpecs.add("Neurology");

        List<String> specs = doctorService.getSpecializations();

        assertNotNull(specs);
        assertEquals(3, specs.size());
        assertTrue(specs.contains("Cardiology"));
        assertTrue(specs.contains("Dermatology"));
        assertTrue(specs.contains("Neurology"));
    }

    @Test
    @DisplayName("DoctorService extracts specializations from findAll() if distinct query returns empty")
    void testGetSpecializationsFallback() {
        mockDistinctSpecs.clear(); // Empty query result

        List<String> specs = doctorService.getSpecializations();

        assertNotNull(specs);
        assertEquals(3, specs.size());
        assertTrue(specs.contains("Cardiology"));
        assertTrue(specs.contains("Dermatology"));
        assertTrue(specs.contains("Neurology"));
    }

    @Test
    @DisplayName("DoctorService filters doctors by specialization case-insensitively")
    void testGetDoctorsBySpecialization() {
        List<Doctor> cardiologists = doctorService.getDoctorsBySpecialization("Cardiology");

        assertNotNull(cardiologists);
        assertEquals(1, cardiologists.size());
        assertEquals("Dr. Arun Kumar", cardiologists.get(0).getFullName());
    }

    @Test
    @DisplayName("DoctorService returns all doctors when specialization is 'ALL' or empty")
    void testGetDoctorsBySpecializationAll() {
        List<Doctor> allDocs = doctorService.getDoctorsBySpecialization("ALL");

        assertNotNull(allDocs);
        assertEquals(3, allDocs.size());
    }

    @Test
    @DisplayName("DoctorService creates doctor if not already present")
    void testCreateDoctor() {
        Doctor newDoc = new Doctor();
        newDoc.setFullName("Dr. New Doctor");
        newDoc.setSpecialization("Pediatrics");
        newDoc.setEmail("newdoc@gmail.com");

        Doctor created = doctorService.createDoctor(newDoc);

        assertNotNull(created);
        assertEquals("Dr. New Doctor", created.getFullName());
    }
}

