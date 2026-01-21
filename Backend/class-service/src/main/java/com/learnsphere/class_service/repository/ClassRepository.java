package com.learnsphere.class_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.learnsphere.class_service.model.Class;

@Repository
public interface ClassRepository extends MongoRepository<Class, String> {
    List<Class> findByTeacherId(String teacherId);
    List<Class> findByStudentIdsContaining(String studentId);
    Optional<Class> findBycode(String code);
}



