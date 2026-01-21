package com.learnsphere.ai.controller;

import com.learnsphere.ai.dto.*;
import com.learnsphere.ai.service.AiGradingService;
import com.learnsphere.ai.service.PdfGradingService;
import com.learnsphere.ai.service.QuestionGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiAssistantController {
    
    @Autowired
    private AiGradingService aiGradingService;
    
    @Autowired
    private QuestionGenerationService questionGenerationService;
    
    @Autowired
    private PdfGradingService pdfGradingService;
    
    /**
     * AI Grading Assistant - Grade a submission based on question and answer
     * POST /api/ai/grade
     */
    @PostMapping("/grade")
    public ResponseEntity<GradingResponse> gradeSubmission(@RequestBody GradingRequest request) {
        try {
            GradingResponse response = aiGradingService.gradeSubmission(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Assignment Generation - Generate questions for an assignment
     * POST /api/ai/generate-questions
     */
    @PostMapping("/generate-questions")
    public ResponseEntity<QuestionGenerationResponse> generateQuestions(@RequestBody QuestionGenerationRequest request) {
        try {
            QuestionGenerationResponse response = questionGenerationService.generateQuestions(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * PDF Grading with Context - Grade a PDF submission using reference material
     * POST /api/ai/grade-pdf
     */
    @PostMapping("/grade-pdf")
    public ResponseEntity<GradingResponse> gradePdfSubmission(@RequestBody PdfGradingRequest request) {
        try {
            GradingResponse response = pdfGradingService.gradePdfSubmission(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("AI Assistant Service is running");
    }
}

