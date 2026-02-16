package com.learnsphere.class_service.controller;

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

import com.learnsphere.class_service.model.Class;
import com.learnsphere.class_service.service.ClassService;

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
    }

    @PostMapping("/teacher/create-class")
    public Class createClass(@RequestBody Class newClass) {
        return classService.createClass(newClass);
    }

    @PostMapping("/student/join-class")
    public ResponseEntity<String> joinClass(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String token
    ) {
        String id = request.get("id");
        String classCode = request.get("classCode");

        if (id == null || classCode == null) {
            return ResponseEntity.badRequest().body("Missing ID or class code");
        }

        boolean success = classService.addStudentToClass(classCode, id);

        return success ? ResponseEntity.ok("Joined class successfully")
                : ResponseEntity.badRequest().body("Failed to join class");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClass(@PathVariable String id) {
        classService.deleteClass(id);
        return ResponseEntity.noContent().build();
    }
}



