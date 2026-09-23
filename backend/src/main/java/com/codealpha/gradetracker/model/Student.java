package com.codealpha.gradetracker.model;

import java.time.Instant;

public record Student(
        long id,
        String name,
        double marks,
        String grade,
        Instant createdAt
) {
}