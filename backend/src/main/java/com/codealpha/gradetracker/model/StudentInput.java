package com.codealpha.gradetracker.model;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

public record StudentInput(
        @NotBlank(message = "Student name is required")
        String name,

        @DecimalMin(value = "0.0", message = "Marks must be between 0 and 100")
        @DecimalMax(value = "100.0", message = "Marks must be between 0 and 100")
        Double marks
) {
}