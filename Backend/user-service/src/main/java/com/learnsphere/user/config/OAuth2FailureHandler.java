package com.learnsphere.user.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception) throws IOException, ServletException {
        
        System.err.println("OAuth2 Authentication Failed:");
        System.err.println("Error: " + exception.getMessage());
        System.err.println("Request URI: " + request.getRequestURI());
        exception.printStackTrace();
        
        String redirectUrl = frontendUrl + "/login?error=oauth_failed&message=" + 
                            java.net.URLEncoder.encode(exception.getMessage(), "UTF-8");
        response.sendRedirect(redirectUrl);
    }
}



