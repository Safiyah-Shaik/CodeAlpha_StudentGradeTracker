package com.codealpha.gradetracker.model;

public record StudentSummary(
        int totalStudents,
        double averageScore,
        double highestScore,
        double lowestScore,
        int passingStudents,
        double passRate
) {
}