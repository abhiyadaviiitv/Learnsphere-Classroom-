// src/main/java/com/example/demo/repository/AssignmentRepository.java
package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Assignment;

@Repository
public interface AssignmentRepository extends MongoRepository<Assignment, String> {

    Optional<List<Assignment>> findByclassId(String id);
    // Custom query methods (if needed)
}