package com.learnsphere.assignment.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.learnsphere.assignment.model.Assignment;
import com.learnsphere.assignment.repository.AssignmentRepository;

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
        return assignmentRepository.save(assignment);
    }

    public void deleteAssignment(String id) {
        assignmentRepository.deleteById(id);
    }

    public Assignment getAssignmentById(String assignmentid) {
        return assignmentRepository.findById(assignmentid).orElse(null);
    }
}



