package com.learnsphere.notification.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learnsphere.notification.model.Notification;
import com.learnsphere.notification.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        return ResponseEntity.ok(notificationService.createNotification(notification));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Notification>> getClassNotifications(@PathVariable String classId) {
        return ResponseEntity.ok(notificationService.getNotificationsByClass(classId));
    }

    @PostMapping("/student/{studentId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @PathVariable String studentId,
            @RequestBody List<String> classIds) {
        return ResponseEntity.ok(notificationService.getUnreadNotificationsForStudent(studentId, classIds));
    }

    @PostMapping("/student/{studentId}/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @PathVariable String studentId,
            @RequestBody List<String> classIds) {
        long count = notificationService.getUnreadCountForStudent(studentId, classIds);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read/{userId}")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable String id,
            @PathVariable String userId) {
        return ResponseEntity.ok(notificationService.markAsRead(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable String id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }
}

