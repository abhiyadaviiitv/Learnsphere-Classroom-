package com.learnsphere.class_service.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learnsphere.class_service.model.Class;
import com.learnsphere.class_service.service.ClassService;
import com.learnsphere.class_service.service.JwtService;

@RestController
@RequestMapping("/api/meetings")
public class MeetingController {

    @Autowired
    private ClassService classService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private JwtService jwtService;

    @Value("${connective.base-url:https://localhost:4000}")
    private String connectiveBaseUrl;

    @PostMapping("/class/{classId}/start")
    public ResponseEntity<?> startMeeting(
            @PathVariable String classId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            String teacherId = extractUserIdFromToken(authHeader);
            if (teacherId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User ID not provided"));
            }

            Optional<Class> classOpt = classService.getClassById(classId);
            if (classOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Class classObj = classOpt.get();

            if (!classObj.getTeacherId().equals(teacherId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Only the class teacher can start meetings"));
            }

            if (Boolean.TRUE.equals(classObj.getIsLive())) {
                return ResponseEntity.ok(Map.of(
                    "message", "Meeting already active",
                    "roomId", classObj.getMeetingRoomId(),
                    "joinUrl", generateJoinUrl(classObj.getMeetingRoomId(), teacherId, true)
                ));
            }

            String roomId = UUID.randomUUID().toString();

            classObj.setIsLive(true);
            classObj.setMeetingRoomId(roomId);
            classObj.setMeetingStartedAt(new Date());
            classObj.setMeetingStartedBy(teacherId);
            classService.updateClass(classObj);

            Map<String, Object> meetingEvent = new HashMap<>();
            meetingEvent.put("type", "MEETING_STARTED");
            meetingEvent.put("classId", classId);
            meetingEvent.put("roomId", roomId);
            meetingEvent.put("startedAt", classObj.getMeetingStartedAt());
            messagingTemplate.convertAndSend("/topic/class/" + classId + "/meeting", meetingEvent);

            return ResponseEntity.ok(Map.of(
                "message", "Meeting started successfully",
                "roomId", roomId,
                "joinUrl", generateJoinUrl(roomId, teacherId, true)
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to start meeting: " + e.getMessage()));
        }
    }

    @PostMapping("/class/{classId}/stop")
    public ResponseEntity<?> stopMeeting(
            @PathVariable String classId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            String teacherId = extractUserIdFromToken(authHeader);
            if (teacherId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User ID not provided"));
            }

            Optional<Class> classOpt = classService.getClassById(classId);
            if (classOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Class classObj = classOpt.get();

            if (!classObj.getTeacherId().equals(teacherId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Only the class teacher can stop meetings"));
            }

            classObj.setIsLive(false);
            classObj.setMeetingRoomId(null);
            classObj.setMeetingStartedAt(null);
            classObj.setMeetingStartedBy(null);
            classService.updateClass(classObj);

            Map<String, Object> meetingEvent = new HashMap<>();
            meetingEvent.put("type", "MEETING_STOPPED");
            meetingEvent.put("classId", classId);
            messagingTemplate.convertAndSend("/topic/class/" + classId + "/meeting", meetingEvent);

            return ResponseEntity.ok(Map.of("message", "Meeting stopped successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to stop meeting: " + e.getMessage()));
        }
    }

    @GetMapping("/class/{classId}/status")
    public ResponseEntity<?> getMeetingStatus(@PathVariable String classId) {
        try {
            Optional<Class> classOpt = classService.getClassById(classId);
            if (classOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Class classObj = classOpt.get();
            boolean isLive = Boolean.TRUE.equals(classObj.getIsLive());

            Map<String, Object> status = new HashMap<>();
            status.put("isLive", isLive);
            if (isLive) {
                status.put("roomId", classObj.getMeetingRoomId());
                status.put("startedAt", classObj.getMeetingStartedAt());
                status.put("startedBy", classObj.getMeetingStartedBy());
            }

            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get meeting status: " + e.getMessage()));
        }
    }

    @GetMapping("/class/{classId}/join-token")
    public ResponseEntity<?> getJoinToken(
            @PathVariable String classId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            String userId = extractUserIdFromToken(authHeader);
            String username = extractUsernameFromToken(authHeader);
            if (userId == null || username == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User information not provided"));
            }

            Optional<Class> classOpt = classService.getClassById(classId);
            if (classOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Class classObj = classOpt.get();

            boolean isAuthorized = classObj.getTeacherId().equals(userId) ||
                    (classObj.getStudentIds() != null && classObj.getStudentIds().contains(userId));

            if (!isAuthorized) {
                return ResponseEntity.status(403).body(Map.of("error", "Not authorized to join this class meeting"));
            }

            if (!Boolean.TRUE.equals(classObj.getIsLive())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Meeting is not active"));
            }

            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", userId);
            claims.put("id", userId);
            claims.put("roomId", classObj.getMeetingRoomId());
            claims.put("classId", classId);
            claims.put("source", "learnsphere");
            claims.put("username", username);
            claims.put("email", username + "@learnsphere.local");
            claims.put("name", username);

            String ssoToken = jwtService.generateSSOToken(username, claims, 60);

            return ResponseEntity.ok(Map.of(
                "token", ssoToken,
                "roomId", classObj.getMeetingRoomId(),
                "joinUrl", generateJoinUrl(classObj.getMeetingRoomId(), userId, classObj.getTeacherId().equals(userId))
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate join token: " + e.getMessage()));
        }
    }

    private String generateJoinUrl(String roomId, String userId, boolean isHost) {
        return connectiveBaseUrl + "/room/" + roomId;
    }

    private String extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.err.println("MeetingController: No Authorization header or invalid format");
            return null;
        }
        try {
            String token = authHeader.substring(7);
            String userId = jwtService.extractUserId(token);
            if (userId == null) {
                // Try to get username and log for debugging
                String username = jwtService.extractUsername(token);
                System.err.println("MeetingController: Could not extract userId from token. Username: " + username);
                // Try to get all claims for debugging
                try {
                    var claims = jwtService.extractAllClaims(token);
                    System.err.println("MeetingController: Available claims: " + claims.keySet());
                    System.err.println("MeetingController: userId claim: " + claims.get("userId"));
                    System.err.println("MeetingController: id claim: " + claims.get("id"));
                } catch (Exception e) {
                    System.err.println("MeetingController: Error extracting claims: " + e.getMessage());
                }
            }
            return userId;
        } catch (Exception e) {
            System.err.println("MeetingController: Error extracting userId: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    private String extractUsernameFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        try {
            String token = authHeader.substring(7);
            return jwtService.extractUsername(token);
        } catch (Exception e) {
            return null;
        }
    }
}

