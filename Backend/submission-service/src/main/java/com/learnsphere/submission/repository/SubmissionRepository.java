package com.learnsphere.submission.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.learnsphere.submission.model.Submission;

@Repository
public interface SubmissionRepository extends MongoRepository<Submission, String> {
    Optional<Submission> findByAssignmentIdAndStudentId(String assignmentid, String studentid);
    List<Submission> findByAssignmentId(String assignmentId);
}



