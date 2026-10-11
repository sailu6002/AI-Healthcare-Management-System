package com.healthcare.backend.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Regression test for the AI request contract: a patient assessment with no
 * symptoms must serialize {@code symptoms} as an empty array, never null.
 * The FastAPI schema types it as list[str] (not optional), and a null used to
 * surface as a 502 from /api/ai/assess.
 */
class AiAssessmentRequestTest {

    @Test
    void missingSymptomsSerializeAsEmptyArrayNotNull() throws Exception {

        AiAssessmentRequest.PatientHealthProfile profile =
                new AiAssessmentRequest.PatientHealthProfile();
        profile.setAge(45);
        profile.setGender("Female");

        AiAssessmentRequest request = new AiAssessmentRequest();
        request.setPatient(profile);

        String json = new ObjectMapper().writeValueAsString(request);

        assertThat(json).contains("\"symptoms\":[]");
        assertThat(json).doesNotContain("\"symptoms\":null");
    }
}
