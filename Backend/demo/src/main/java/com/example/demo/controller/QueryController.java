package com.example.demo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Query;
import com.example.demo.service.QueryService;

@RestController
@RequestMapping("/api/queries")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class QueryController {

    @Autowired
    private QueryService queryService;

    @PostMapping("/class/{classId}")
    public ResponseEntity<Query> createQuery(@PathVariable String classId, @RequestBody Query query) {
        query.setClassId(classId);
        return ResponseEntity.ok(queryService.createQuery(query));
    }

    @GetMapping("/class/{classId}/student/{studentId}")
    public ResponseEntity<List<Query>> getStudentQueries(@PathVariable String classId, @PathVariable String studentId) {
        return ResponseEntity.ok(queryService.getQueriesByClassAndStudent(classId, studentId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Query>> getClassQueries(@PathVariable String classId) {
        return ResponseEntity.ok(queryService.getQueriesByClass(classId));
    }

    @PutMapping("/{queryId}/answer")
    public ResponseEntity<Query> answerQuery(@PathVariable String queryId, @RequestBody Map<String, String> payload) {
        String answer = payload.get("answer");
        return ResponseEntity.ok(queryService.answerQuery(queryId, answer));
    }
}
