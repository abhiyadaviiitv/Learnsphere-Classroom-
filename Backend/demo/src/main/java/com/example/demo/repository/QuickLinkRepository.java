package com.example.demo.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.QuickLink;

@Repository
public interface QuickLinkRepository extends MongoRepository<QuickLink, String> {
    List<QuickLink> findByClassId(String classId);
}
