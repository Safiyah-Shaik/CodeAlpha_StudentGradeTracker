package com.codealpha.gradetracker.service;

import com.codealpha.gradetracker.model.Student;
import com.codealpha.gradetracker.model.StudentInput;
import com.codealpha.gradetracker.model.StudentSummary;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class StudentService {
    private static final double PASSING_MARKS = 60.0;

    // Intentionally in-memory for the internship project: easy to read and easy to extend.
    private final ConcurrentHashMap<Long, Student> students = new ConcurrentHashMap<>();
    private final AtomicLong nextId = new AtomicLong(1);

    public StudentService() {
        add(new StudentInput("Aarav Mehta", 92.0));
        add(new StudentInput("Diya Sharma", 78.0));
        add(new StudentInput("Kabir Singh", 64.0));
    }

    public List<Student> findAll() {
        return students.values().stream()
                .sorted(Comparator.comparingLong(Student::id))
                .toList();
    }

    public Student add(StudentInput input) {
        long id = nextId.getAndIncrement();
        Student student = toStudent(id, input, Instant.now());
        students.put(id, student);
        return student;
    }

    public Student update(long id, StudentInput input) {
        Student existing = students.get(id);
        if (existing == null) {
            return null;
        }

        Student updated = toStudent(id, input, existing.createdAt());
        students.put(id, updated);
        return updated;
    }

    public boolean delete(long id) {
        return students.remove(id) != null;
    }

    public StudentSummary getSummary() {
        List<Student> allStudents = new ArrayList<>(students.values());
        if (allStudents.isEmpty()) {
            return new StudentSummary(0, 0, 0, 0, 0, 0);
        }

        double total = allStudents.stream().mapToDouble(Student::marks).sum();
        double highest = allStudents.stream().mapToDouble(Student::marks).max().orElse(0);
        double lowest = allStudents.stream().mapToDouble(Student::marks).min().orElse(0);
        int passing = (int) allStudents.stream()
                .filter(student -> student.marks() >= PASSING_MARKS)
                .count();

        return new StudentSummary(
                allStudents.size(),
                round(total / allStudents.size()),
                round(highest),
                round(lowest),
                passing,
                round((passing * 100.0) / allStudents.size())
        );
    }

    private Student toStudent(long id, StudentInput input, Instant createdAt) {
        String normalizedName = input.name().trim();
        double marks = input.marks();
        return new Student(id, normalizedName, round(marks), gradeFor(marks), createdAt);
    }

    private String gradeFor(double marks) {
        if (marks >= 90) return "A";
        if (marks >= 80) return "B";
        if (marks >= 70) return "C";
        if (marks >= 60) return "D";
        return "F";
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}