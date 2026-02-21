// src/main/java/com/example/demo/repository/SubmissionRepository.java
package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Submission;

@Repository
public interface SubmissionRepository extends MongoRepository<Submission, String> {

    Optional<Submission> findByAssignmentIdAndStudentId(String assignmentid, String studentid);

    java.util.List<Submission> findByAssignmentId(String assignmentId);
}