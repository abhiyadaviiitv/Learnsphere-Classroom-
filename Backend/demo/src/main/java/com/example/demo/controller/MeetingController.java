package com.example.demo.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Class;
import com.example.demo.model.User;
import com.example.demo.service.ClassService;
import com.example.demo.service.JwtService;
import com.example.demo.service.UserService;

@RestController
@RequestMapping("/api/meetings")
public class MeetingController {

    @Autowired
    private ClassService classService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Value("${connective.base-url:https://localhost:4000}")
    private String connectiveBaseUrl;

    @Value("${connective.shared-secret:}")
    private String sharedSecret;

    /**
     * Start a meeting for a class (Teacher only)
     */
    @PostMapping("/class/{classId}/start")
    public ResponseEntity<?> startMeeting(@PathVariable String classId) {
        try {
            // Get authenticated user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName(); // Get username from JWT
            User user = userService.findByUsername(username);
            String teacherId = user.getId(); // Get actual user ID

            Optional<Class> classOpt = classService.getClassById(classId);
            if (classOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Class classObj = classOpt.get();

            // Verify teacher owns this class
            if (!classObj.getTeacherId().equals(teacherId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Only the class teacher can start meetings"));
            }

            // Check if meeting is already active
            if (Boolean.TRUE.equals(classObj.getIsLive())) {
                return ResponseEntity.ok(Map.of(
                    "message", "Meeting already active",
                    "roomId", classObj.getMeetingRoomId(),
                    "joinUrl", generateJoinUrl(classObj.getMeetingRoomId(), teacherId, true)
                ));
            }

            // Generate a unique room ID (UUID format like Connective uses)
            // Connective uses UUID v4 format, so we'll use the same
            String roomId = UUID.randomUUID().toString();

            // Update class with meeting info
            classObj.setIsLive(true);
            classObj.setMeetingRoomId(roomId);
            classObj.setMeetingStartedAt(new Date());
            classObj.setMeetingStartedBy(teacherId);
            classService.updateClass(classObj);

            // Broadcast meeting started event to all class members via WebSocket
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

    /**
     * Stop a meeting for a class (Teacher only)
     */
    @PostMapping("/class/{classId}/stop")
    public ResponseEntity<?> stopMeeting(@PathVariable String classId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User user = userService.findByUsername(username);
            String teacherId = user.getId();

            Optional<Class> classOpt = classService.getClassById(classId);
            if (classOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Class classObj = classOpt.get();

            // Verify teacher owns this class
            if (!classObj.getTeacherId().equals(teacherId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Only the class teacher can stop meetings"));
            }

            // Update class meeting status
            classObj.setIsLive(false);
            classObj.setMeetingRoomId(null);
            classObj.setMeetingStartedAt(null);
            classObj.setMeetingStartedBy(null);
            classService.updateClass(classObj);

            // Broadcast meeting stopped event
            Map<String, Object> meetingEvent = new HashMap<>();
            meetingEvent.put("type", "MEETING_STOPPED");
            meetingEvent.put("classId", classId);
            messagingTemplate.convertAndSend("/topic/class/" + classId + "/meeting", meetingEvent);

            return ResponseEntity.ok(Map.of("message", "Meeting stopped successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to stop meeting: " + e.getMessage()));
        }
    }

    /**
     * Get meeting status for a class
     */
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

    /**
     * Generate SSO token for joining Connective meeting
     */
    @GetMapping("/class/{classId}/join-token")
    public ResponseEntity<?> getJoinToken(@PathVariable String classId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User user = userService.findByUsername(username);
            String userId = user.getId();

            Optional<Class> classOpt = classService.getClassById(classId);
            if (classOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Class classObj = classOpt.get();

            // Verify user is part of this class (teacher or student)
            boolean isAuthorized = classObj.getTeacherId().equals(userId) ||
                    (classObj.getStudentIds() != null && classObj.getStudentIds().contains(userId));

            if (!isAuthorized) {
                return ResponseEntity.status(403).body(Map.of("error", "Not authorized to join this class meeting"));
            }

            if (!Boolean.TRUE.equals(classObj.getIsLive())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Meeting is not active"));
            }

            // Generate short-lived JWT token (60 seconds)
            String ssoToken = generateSSOToken(userId, classObj.getMeetingRoomId(), classId);

            return ResponseEntity.ok(Map.of(
                "token", ssoToken,
                "roomId", classObj.getMeetingRoomId(),
                "joinUrl", generateJoinUrl(classObj.getMeetingRoomId(), userId, classObj.getTeacherId().equals(userId))
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate join token: " + e.getMessage()));
        }
    }

    /**
     * Generate join URL for Connective
     */
    private String generateJoinUrl(String roomId, String userId, boolean isHost) {
        // This will be handled by the frontend, but we provide the roomId
        return connectiveBaseUrl + "/room/" + roomId;
    }

    /**
     * Generate short-lived SSO JWT token for Connective
     * This token will be verified by Connective's SSO endpoint
     * Note: Both apps should share the same JWT_SECRET for this to work
     */
    private String generateSSOToken(String userId, String roomId, String classId) {
        try {
            // Get user details for token generation
            Optional<User> userOpt = userService.findById(userId);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("User not found");
            }
            User user = userOpt.get();

            // Create custom claims for SSO token
            // Note: The 'sub' field is set by JwtService, but we add it here for clarity
            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", userId);
            claims.put("id", userId); // For compatibility with Connective (required field)
            claims.put("roomId", roomId);
            claims.put("classId", classId);
            claims.put("source", "learnsphere");
            claims.put("username", user.getUsername());
            claims.put("email", user.getEmail() != null ? user.getEmail() : user.getUsername() + "@learnsphere.local");
            claims.put("name", user.getUsername()); // Use username as name

            // Generate short-lived token (60 seconds expiration)
            // The username is used as the 'sub' (subject) field in JWT
            String token = jwtService.generateSSOToken(user.getUsername(), claims, 60);
            
            // Log token generation for debugging (remove in production)
            System.out.println("Generated SSO token for user: " + userId + ", room: " + roomId);
            
            return token;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate SSO token", e);
        }
    }
}

