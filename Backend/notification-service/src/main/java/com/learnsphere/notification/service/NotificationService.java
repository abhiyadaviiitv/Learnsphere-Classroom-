package com.learnsphere.notification.service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.learnsphere.notification.model.Notification;
import com.learnsphere.notification.repository.NotificationRepository;

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

    public Notification markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getReadBy().contains(userId)) {
            notification.getReadBy().add(userId);
            notificationRepository.save(notification);
        }
        
        return notification;
    }

    public List<Notification> getUnreadNotificationsForStudent(String studentId, List<String> classIds) {
        List<Notification> allNotifications = notificationRepository.findAll();
        
        return allNotifications.stream()
                .filter(notification -> classIds.contains(notification.getClassId()))
                .filter(notification -> !notification.getReadBy().contains(studentId))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public long getUnreadCountForStudent(String studentId, List<String> classIds) {
        return getUnreadNotificationsForStudent(studentId, classIds).size();
    }
}


