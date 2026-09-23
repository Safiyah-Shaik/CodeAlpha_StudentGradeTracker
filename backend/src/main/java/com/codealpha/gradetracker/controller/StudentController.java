package com.codealpha.gradetracker.controller;

import com.codealpha.gradetracker.model.ErrorResponse;
import com.codealpha.gradetracker.model.Student;
import com.codealpha.gradetracker.model.StudentInput;
import com.codealpha.gradetracker.model.StudentSummary;
import com.codealpha.gradetracker.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {
    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public List<Student> listStudents() {
        return studentService.findAll();
    }

    @PostMapping
    public ResponseEntity<Student> createStudent(@Valid @RequestBody StudentInput input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.add(input));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(
            @PathVariable long id,
            @Valid @RequestBody StudentInput input
    ) {
        Student updated = studentService.update(id, input);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Student record not found"));
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable long id) {
        if (!studentService.delete(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Student record not found"));
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public StudentSummary getStudentSummary() {
        return studentService.getSummary();
    }
}