package com.learnsphere.user.service;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.learnsphere.user.model.User;
import com.learnsphere.user.repository.UserRepository;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(User user) {
        logger.info("Registering user: {}", user.getUsername());
        
        // Check for existing username (case-insensitive)
        if (userRepository.findByUsernameIgnoreCase(user.getUsername()).isPresent()) {
            logger.error("Username already exists: {}", user.getUsername());
            throw new RuntimeException("Username already exists");
        }
        // Check for existing email (case-insensitive)
        if (userRepository.findByEmailIgnoreCase(user.getEmail()).isPresent()) {
            logger.error("Email already exists: {}", user.getEmail());
            throw new RuntimeException("Email already exists");
        }
        
        // If role is not set, set default role
        if (user.getRole() == null) {
            user.setRole("USER");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        logger.info("User registered successfully: {}", savedUser.getUsername());
        return savedUser;
    }

    public User findByUsername(String username) {
        logger.info("Finding user by username: {}", username);
        // Try exact match first (faster), then case-insensitive lookup
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            return user.get();
        }
        // Fallback to case-insensitive search
        return userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> {
                    logger.error("User not found: {}", username);
                    return new UsernameNotFoundException("User not found");
                });
    }
    
    public User findByEmail(String email) {
        logger.info("Finding user by email: {}", email);
        // Try exact match first (faster), then case-insensitive lookup
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            return user.get();
        }
        // Fallback to case-insensitive search
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> {
                    logger.error("User not found with email: {}", email);
                    return new UsernameNotFoundException("User not found");
                });
    }
    
    public User save(User user) {
        logger.info("Saving user: {}", user.getUsername());
        return userRepository.save(user);
    }

    public String findUsernameById(String id) {
        Optional<User> u = userRepository.findById(id);
        if (u.isPresent()) {
            return u.get().getUsername();
        }
        throw new UsernameNotFoundException("User not found with id: " + id);
    }

    public User findByStudentId(String id) {
        Optional<User> u = userRepository.findById(id);
        if (u.isPresent()) {
            return u.get();
        }
        throw new UsernameNotFoundException("User not found with id: " + id);
    }

    public boolean existsByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username).isPresent();
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }
}

