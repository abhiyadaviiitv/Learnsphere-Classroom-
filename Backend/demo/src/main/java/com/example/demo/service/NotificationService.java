package com.example.demo.service;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.model.Notification;
import com.example.demo.repository.NotificationRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification createNotification(Notification notification) {
        notification.setCreatedAt(new Date());
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsByClass(String classId) {
        return notificationRepository.findByClassIdOrderByCreatedAtDesc(classId);
    }

    public void deleteNotification(String id) {
        notificationRepository.deleteById(id);
    }
}
