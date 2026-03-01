package com.example.demo.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import com.example.demo.model.User;
import com.example.demo.service.JwtService;
import com.example.demo.service.UserService;
import com.example.demo.service.fileStorageService;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import com.example.demo.dto.Attachment;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class UserController {

	private static final Logger logger = LoggerFactory.getLogger(UserController.class);

	@Autowired
	private UserService userService;

	@Autowired
	private JwtService jwtService;

	@Autowired
	private AuthenticationManager authenticationManager;
	
	@Autowired
	private fileStorageService fileStorageService;

	@GetMapping("/users/{id}")
	public String getteachername(@PathVariable String id) {
		return userService.findbyid(id);
	}

	@GetMapping("/users/student/{id}")
	public User getstudentrecord(@PathVariable String id) {
		return userService.findbystudentid(id);
	}

	@PostMapping("auth/register")
	public ResponseEntity<?> register(@RequestBody User user) {
		try {
			logger.info("Registering user with data: {}", user);
			User registeredUser = userService.registerUser(user);
			// Generate JWT token after successful registration
			String token = jwtService.generateToken(registeredUser.getUsername());
			Map<String, Object> response = new HashMap<>();
			response.put("token", token);
			response.put("user", registeredUser);
			logger.info("User registered successfully: {}", registeredUser.getUsername());
			return ResponseEntity.ok(response);
		} catch (RuntimeException e) {
			logger.error("Registration error: {}", e.getMessage());
			Map<String, String> response = new HashMap<>();
			response.put("error", e.getMessage());
			return ResponseEntity.badRequest().body(response);
		}
	}

	@PostMapping("auth/login")
	public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
		System.out.println("in login");
		try {
			String email = loginRequest.get("email");
			String password = loginRequest.get("password");
			
			if (email == null || password == null) {
				Map<String, String> response = new HashMap<>();
				response.put("error", "Email and password are required");
				return ResponseEntity.badRequest().body(response);
			}
			
			logger.info("Attempting login for email: {}", email);
			
			// Find user by email (case-insensitive)
			User user;
			try {
				user = userService.findByEmail(email);
				logger.info("User found in database: {}", user.getUsername());
			} catch (Exception e) {	
				logger.error("User not found in database with email: {}", email);
				Map<String, String> response = new HashMap<>();
				response.put("error", "User not found");
				return ResponseEntity.badRequest().body(response);
			}
			
			// Use the user's username for Spring Security authentication
			// (Spring Security uses username, but we allow login with email)
			Authentication authentication = authenticationManager
					.authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(), password));

			if (authentication.isAuthenticated()) {
				logger.info("Authentication successful for email: {} (username: {})", email, user.getUsername());
				String token = jwtService.generateToken(user.getUsername());
				Map<String, Object> response = new HashMap<>();
				response.put("token", token);
				response.put("id", user.getId());
				response.put("role", user.getRole());
				response.put("username", user.getUsername());
				response.put("profilePicture", user.getProfilePicture() != null ? user.getProfilePicture() : "");
				return ResponseEntity.ok(response);
			} else {
				logger.error("Authentication failed for email: {}", email);
				Map<String, String> response = new HashMap<>();
				response.put("error", "Authentication failed");
				return ResponseEntity.badRequest().body(response);
			}
		} catch (Exception e) {		
			logger.error("Login error: {}", e.getMessage());
			Map<String, String> response = new HashMap<>();
			response.put("error", "Invalid credentials");
			return ResponseEntity.badRequest().body(response);
		}
	}

	@GetMapping("/profile")
	public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authHeader) {
		try {
			// Extract username from the JWT token
			String token = authHeader.replace("Bearer ", "");
			String username = jwtService.extractUsername(token);
			logger.info("Fetching profile for user: {}", username);
			User user = userService.findByUsername(username);
			return ResponseEntity.ok(user);
		} catch (Exception e) {
			logger.error("Error fetching profile: {}", e.getMessage());
			Map<String, String> response = new HashMap<>();
			response.put("error", "Error fetching profile");
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}
	
	@PostMapping("/update")
	public ResponseEntity<?> updateProfile(@RequestBody User user) {
		try {
			logger.info("Updating profile for user: {}", user.getUsername());
			User existingUser = userService.findByUsername(user.getUsername());
			existingUser.setEmail(user.getEmail());
			// Don't update password here - should have a separate endpoint with proper validation
			User updatedUser = userService.save(existingUser);
			return ResponseEntity.ok(updatedUser);
		} catch (Exception e) {
			logger.error("Error updating profile: {}", e.getMessage());
			Map<String, String> response = new HashMap<>();
			response.put("error", "Error updating profile");
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}

	@PutMapping(value = "/profile/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String authHeader,
			@RequestPart(value = "username", required = false) String username,
			@RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) {
		try {
			String token = authHeader.replace("Bearer ", "");
			String currentUsername = jwtService.extractUsername(token);
			User user = userService.findByUsername(currentUsername);
			
			if (username != null && !username.trim().isEmpty()) {
				// Check if username is already taken (and not by current user)
				if (!username.equals(currentUsername) && userService.existsByUsername(username)) {
					Map<String, String> response = new HashMap<>();
					response.put("error", "Username already taken");
					return ResponseEntity.badRequest().body(response);
				}
				user.setUsername(username);
			}
			
			// Handle profile picture upload
			if (profilePicture != null && !profilePicture.isEmpty()) {
				try {
					List<MultipartFile> files = List.of(profilePicture);
					List<Attachment> attachments = fileStorageService.storeFiles(files);
					if (!attachments.isEmpty()) {
						user.setProfilePicture(attachments.get(0).getFileUrl());
					}
				} catch (RuntimeException e) {
					logger.error("Error uploading profile picture: {}", e.getMessage());
					Map<String, String> response = new HashMap<>();
					response.put("error", "Failed to upload profile picture: " + e.getMessage());
					return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
				}
			}
			
			User updatedUser = userService.save(user);
			return ResponseEntity.ok(updatedUser);
		} catch (Exception e) {
			logger.error("Error updating profile: {}", e.getMessage());
			Map<String, String> response = new HashMap<>();
			response.put("error", "Error updating profile: " + e.getMessage());
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}

	@PostMapping("/update-role")
	public ResponseEntity<?> updateRole(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Map<String, String> payload) {
		try {
			String role = payload.get("role");
			logger.info("Updating role for user: {} to {}", userDetails.getUsername(), role);

			if (role == null || (!role.equals("TEACHER") && !role.equals("STUDENT"))) {
				return ResponseEntity.badRequest().body(Map.of("error", "Invalid role. Must be TEACHER or STUDENT"));
			}

			User user = userService.findByUsername(userDetails.getUsername());
			user.setRole(role);
			userService.save(user);

			return ResponseEntity.ok(Map.of("message", "Role updated successfully"));
		} catch (Exception e) {
			logger.error("Error updating role: {}", e.getMessage());
			Map<String, String> response = new HashMap<>();
			response.put("error", "Error updating role");
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}
}

