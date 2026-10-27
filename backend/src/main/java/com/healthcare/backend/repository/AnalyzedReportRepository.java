package com.healthcare.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.healthcare.backend.model.AnalyzedReport;

@Repository
public interface AnalyzedReportRepository extends JpaRepository<AnalyzedReport, Long> {

    List<AnalyzedReport> findByPatientIdOrderByUploadedAtDesc(Long patientId);

    List<AnalyzedReport> findAllByOrderByUploadedAtDesc();
}

