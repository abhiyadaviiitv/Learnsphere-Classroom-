package com.learnsphere.submission.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.learnsphere.submission.model.Submission;
import com.learnsphere.submission.repository.SubmissionRepository;

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
        return submissionRepository.findByAssignmentIdAndStudentId(assignmentid, studentid);
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
        return submissionRepository.findById(SubmissionId).orElse(null);
    }

    public void updateSubmission(Submission oldsubmission) {
        submissionRepository.save(oldsubmission);
    }
}



