package com.learnsphere.analytics.client;

import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign Client for calling User Service
 * This replaces direct database access to User collection
 */
@FeignClient(name = "user-service")
public interface UserServiceClient {
    
    /**
     * Get user by ID
     * @param id User ID
     * @return User data as Map (or create a UserDTO in common module)
     */
    @GetMapping("/api/users/{id}")
    Map<String, Object> getUserById(@PathVariable String id);
    
    /**
     * Get username by ID (lightweight call)
     * @param id User ID
     * @return Username as String
     */
    @GetMapping("/api/users/{id}/name")
    String getUsernameById(@PathVariable String id);
}

