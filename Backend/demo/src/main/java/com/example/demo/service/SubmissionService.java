// src/main/java/com/example/demo/service/SubmissionService.java
package com.example.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.model.Submission;
import com.example.demo.repository.SubmissionRepository;

@Service
public class SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;

    public List<Submission> getAllSubmissions() {
        return submissionRepository.findAll();
    }

    public Optional<Submission> getSubmissionById(String id) {
        return submissionRepository.findById(id);
    }

    public Optional<Submission> getSubmissionByAssignmentIdAndStudentId(String assignmentid, String studentid) {
    System.out.println("Searching for assignmentId: " + assignmentid + ", studentId: " + studentid);
    Optional<Submission> result = submissionRepository.findByAssignmentIdAndStudentId(assignmentid, studentid);
    System.out.println("Found: " + result);
    return result;
}

    public List<Submission> getSubmissionsByAssignmentId(String assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId);
    }
    public Submission createSubmission(Submission submission) {
        return submissionRepository.save(submission);
    }

    public void deleteSubmission(String id) {
        submissionRepository.deleteById(id);
    }

    public Submission findoldSubmission(String SubmissionId) {
        return submissionRepository.findById(SubmissionId).get();
    }

    public void updateSubmission(Submission oldsubmission) {
        submissionRepository.save(oldsubmission);
    }

    

    // Additional methods for updating submissions, etc.
}