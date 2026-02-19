package com.learnsphere.class_service.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.learnsphere.class_service.model.QuickLink;

@Repository
public interface QuickLinkRepository extends MongoRepository<QuickLink, String> {
    List<QuickLink> findByClassId(String classId);
}


