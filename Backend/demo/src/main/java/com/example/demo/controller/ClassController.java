// src/main/java/com/example/demo/controller/ClassController.java
package com.example.demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Class;
import com.example.demo.service.ClassService;

@RestController
@RequestMapping("/api/classes")
public class ClassController {

    @Autowired
    private ClassService classService;

    @GetMapping("/")
    public List<Class> getAllClasses() {
        return classService.getAllClasses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Class> getClassById(@PathVariable String id) {
        Optional<Class> classObj = classService.getClassById(id);
        return classObj.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/teacher/{teacherId}")
    public List<Class> getClassesByTeacher(@PathVariable String teacherId) {
        return classService.getClassesByTeacher(teacherId);
    }

    @GetMapping("/student/{id}")
    public List<Class> getClassesByStudent(@PathVariable String id) {
        return classService.getClassesByStudent(id);
    };

    @PostMapping("/teacher/create-class")
    public Class createClass(@RequestBody Class newClass) {
        System.out.println(newClass.getTeacherId());
        return classService.createClass(newClass);
    }

    @PostMapping("student/join-class")
    public ResponseEntity<String> joinClass(
            @RequestBody Map<String, String> request, // Accept JSON body
            @RequestHeader("Authorization") String token // Get JWT from header
    ) {
        // 1. Get data from request body
        String id = request.get("id");
        String classCode = request.get("classCode");

        System.out.println(id + classCode);
        // 2. Validate (optional: extract ID from JWT instead)
        if (id == null || classCode == null) {
            return ResponseEntity.badRequest().body("Missing ID or class code");
        }

        // 3. Add student to class
        boolean success = classService.addStudentToClass(classCode, id);

        return success ? ResponseEntity.ok("Joined class successfully")
                : ResponseEntity.badRequest().body("Failed to join class");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClass(@PathVariable String id) {
        classService.deleteClass(id);
        return ResponseEntity.noContent().build();
    }

    // Additional endpoints for updating classes, etc.
}