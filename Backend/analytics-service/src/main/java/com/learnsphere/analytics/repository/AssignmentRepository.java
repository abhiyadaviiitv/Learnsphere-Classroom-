package com.learnsphere.analytics.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.learnsphere.analytics.model.Assignment;

@Repository
public interface AssignmentRepository extends MongoRepository<Assignment, String> {
    Optional<List<Assignment>> findByclassId(String id);
}


