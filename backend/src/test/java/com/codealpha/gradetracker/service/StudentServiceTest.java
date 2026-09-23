package com.codealpha.gradetracker.service;

import com.codealpha.gradetracker.model.Student;
import com.codealpha.gradetracker.model.StudentInput;
import com.codealpha.gradetracker.model.StudentSummary;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StudentServiceTest {

    @Test
    void summaryRecalculatesForAddUpdateAndDelete() {
        StudentService service = new StudentService();

        StudentSummary initial = service.getSummary();
        assertSummary(initial, 3, 78.0, 92.0, 64.0, 3, 100.0);

        Student added = service.add(new StudentInput("Failing student", 50.0));
        assertEquals("F", added.grade());
        StudentSummary afterAdd = service.getSummary();
        assertSummary(afterAdd, 4, 71.0, 92.0, 50.0, 3, 75.0);

        Student updated = service.update(added.id(), new StudentInput("Top student", 100.0));
        assertEquals("A", updated.grade());
        StudentSummary afterUpdate = service.getSummary();
        assertSummary(afterUpdate, 4, 83.5, 100.0, 64.0, 4, 100.0);

        service.delete(added.id());
        StudentSummary afterDelete = service.getSummary();
        assertSummary(afterDelete, 3, 78.0, 92.0, 64.0, 3, 100.0);
    }

    private void assertSummary(
            StudentSummary summary,
            int total,
            double average,
            double highest,
            double lowest,
            int passing,
            double passRate
    ) {
        assertEquals(total, summary.totalStudents());
        assertEquals(average, summary.averageScore());
        assertEquals(highest, summary.highestScore());
        assertEquals(lowest, summary.lowestScore());
        assertEquals(passing, summary.passingStudents());
        assertEquals(passRate, summary.passRate());
    }
}