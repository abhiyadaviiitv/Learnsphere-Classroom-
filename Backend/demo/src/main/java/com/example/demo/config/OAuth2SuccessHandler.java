package com.example.demo.config;

import java.io.IOException;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.JwtService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    
    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public OAuth2SuccessHandler(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                Authentication authentication) throws IOException, ServletException {
        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            
            // Get user info from OAuth provider
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            
            // Handle GitHub OAuth (uses different attribute names)
            if (email == null) {
                // Try GitHub-specific attributes
                String login = oAuth2User.getAttribute("login"); // GitHub username
                if (login != null) {
                    // For GitHub, if email is not available, use login@github.oauth
                    email = login + "@github.oauth";
                } else {
                    // Fallback to sub (Google uses this)
                    String sub = oAuth2User.getAttribute("sub");
                    if (sub != null) {
                        email = sub + "@oauth.user";
                    } else {
                        // Last resort: use name or throw error
                        throw new RuntimeException("Unable to extract email or identifier from OAuth provider");
                    }
                }
            }
            
            if (name == null) {
                // Try GitHub login attribute
                String login = oAuth2User.getAttribute("login");
                if (login != null) {
                    name = login;
                } else {
                    // Fallback to sub
                    String sub = oAuth2User.getAttribute("sub");
                    name = (sub != null) ? sub : email;
                }
            }
        
        // Check if user exists, if not create a new one
        Optional<User> existingUser = userRepository.findByEmail(email);
        User user;
        
        if (existingUser.isEmpty()) {
            user = new User();
            user.setEmail(email);
            user.setUsername(email); // Use email as username for OAuth users
            // Set a secure random password that the user won't know
            // They'll only login via OAuth so this is fine
            user.setPassword("$2a$12$" + java.util.UUID.randomUUID().toString());
            user.setRole("USER");
            user = userRepository.save(user);
        } else {
            user = existingUser.get();
        }
        
            // Generate JWT token with email (which is also username for OAuth users)
            String token = jwtService.generateToken(user.getUsername());
            
            // Redirect to frontend with token
            String redirectUrl = frontendUrl + "/oauth2/redirect?token=" + token;
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            // Log error for debugging
            System.err.println("Error in OAuth2SuccessHandler: " + e.getMessage());
            e.printStackTrace();
            
            // Redirect to frontend with error
            String redirectUrl = frontendUrl + "/login?error=oauth_error&message=" + 
                                java.net.URLEncoder.encode("Authentication processing failed: " + e.getMessage(), "UTF-8");
            response.sendRedirect(redirectUrl);
        }
    }
} 