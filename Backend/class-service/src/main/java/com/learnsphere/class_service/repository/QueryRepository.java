package com.learnsphere.class_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.learnsphere.class_service.model.Query;

@Repository
public interface QueryRepository extends MongoRepository<Query, String> {
    List<Query> findByClassId(String classId);
    List<Query> findByStudentId(String studentId);
    List<Query> findByClassIdAndStudentId(String classId, String studentId);
}


