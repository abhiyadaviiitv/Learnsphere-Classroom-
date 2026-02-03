// src/main/java/com/example/demo/service/AssignmentService.java
package com.example.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.model.Assignment;
import com.example.demo.repository.AssignmentRepository;

@Service
public class AssignmentService {

    @Autowired
    private AssignmentRepository assignmentRepository;

    public List<Assignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    public Optional<List<Assignment>> getAssignmentListByclassId(String id) {
        return assignmentRepository.findByclassId(id);
    }

    public Assignment createAssignment(Assignment assignment) {
        System.out.println("i am creating assignment \n\n\n\n");
        return assignmentRepository.save(assignment);
    }

    public void deleteAssignment(String id) {
        assignmentRepository.deleteById(id);
    }

    public Assignment getAssignmentById(String assignmentid) {
        return assignmentRepository.findById(assignmentid).get();
    }

    // Additional methods for updating assignments, etc.
}