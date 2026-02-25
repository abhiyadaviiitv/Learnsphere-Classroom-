package com.learnsphere.user.config;

import java.io.IOException;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.learnsphere.user.model.User;
import com.learnsphere.user.repository.UserRepository;
import com.learnsphere.user.service.JwtService;

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
                String login = oAuth2User.getAttribute("login");
                if (login != null) {
                    email = login + "@github.oauth";
                } else {
                    String sub = oAuth2User.getAttribute("sub");
                    if (sub != null) {
                        email = sub + "@oauth.user";
                    } else {
                        throw new RuntimeException("Unable to extract email or identifier from OAuth provider");
                    }
                }
            }
            
            if (name == null) {
                String login = oAuth2User.getAttribute("login");
                if (login != null) {
                    name = login;
                } else {
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
                user.setUsername(email);
                user.setPassword("$2a$12$" + java.util.UUID.randomUUID().toString());
                user.setRole("USER");
                user = userRepository.save(user);
            } else {
                user = existingUser.get();
            }
            
            // Generate JWT token
            String token = jwtService.generateToken(user.getUsername(), user.getId());
            
            // Redirect to frontend with token
            String redirectUrl = frontendUrl + "/oauth2/redirect?token=" + token;
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            System.err.println("Error in OAuth2SuccessHandler: " + e.getMessage());
            e.printStackTrace();
            
            String redirectUrl = frontendUrl + "/login?error=oauth_error&message=" + 
                                java.net.URLEncoder.encode("Authentication processing failed: " + e.getMessage(), "UTF-8");
            response.sendRedirect(redirectUrl);
        }
    }
}


