package com.learnsphere.notification.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.learnsphere.notification.model.Notification;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByClassId(String classId);
    List<Notification> findByClassIdOrderByCreatedAtDesc(String classId);
}


