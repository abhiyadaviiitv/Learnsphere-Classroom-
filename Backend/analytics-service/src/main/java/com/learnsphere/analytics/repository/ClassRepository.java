package com.learnsphere.analytics.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.learnsphere.analytics.model.Class;

@Repository
public interface ClassRepository extends MongoRepository<Class, String> {
}


