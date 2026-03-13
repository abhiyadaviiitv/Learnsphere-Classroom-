package com.learnsphere.ai.controller;

import com.learnsphere.ai.service.AiDetectionService;
import com.learnsphere.ai.service.AiGradingService;
import com.learnsphere.ai.service.ChatService;
import com.learnsphere.ai.service.PdfGradingService;
import com.learnsphere.ai.service.QuestionGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiAssistantController {

    private final ChatService chatService;
    private final AiDetectionService aiDetectionService;
    private final AiGradingService aiGradingService;
    private final PdfGradingService pdfGradingService;
    private final QuestionGenerationService questionGenerationService;

    @Autowired
    public AiAssistantController(AiDetectionService aiDetectionService, ChatService chatService,
            AiGradingService aiGradingService, PdfGradingService pdfGradingService,
            QuestionGenerationService questionGenerationService) {
        this.aiDetectionService = aiDetectionService;
        this.chatService = chatService;
        this.aiGradingService = aiGradingService;
        this.pdfGradingService = pdfGradingService;
        this.questionGenerationService = questionGenerationService;
    }

    @PostMapping("/chat")
    public ResponseEntity<String> chat(@RequestBody Map<String, Object> request) {
        String query = (String) request.get("query");
        @SuppressWarnings("unchecked")
        List<String> allowedClassIds = (List<String>) request.get("allowedClassIds");

        if (query == null || query.isEmpty()) {
            return ResponseEntity.badRequest().body("Query is required");
        }

        String response = chatService.chat(query, allowedClassIds);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ingest")
    public ResponseEntity<String> ingest(@RequestBody com.learnsphere.ai.dto.DataIngestionRequest request) {
        if (request.getClassId() == null || request.getClassId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("classId is required");
        }

        chatService.ingestDocument(request);
        return ResponseEntity.ok("Document ingested successfully for class: " + request.getClassId());
    }

    @PostMapping("/detect")
    public ResponseEntity<String> detect(@RequestBody Map<String, String> request) {
        String text = request.get("text");

        if (text == null || text.isEmpty()) {
            return ResponseEntity.badRequest().body("Text is required");
        }

        String analysis = aiDetectionService.detectAiContent(text);
        return ResponseEntity.ok(analysis);
    }

    @PostMapping("/generate-questions")
    public ResponseEntity<com.learnsphere.ai.dto.QuestionGenerationResponse> generateQuestions(
            @RequestBody com.learnsphere.ai.dto.QuestionGenerationRequest request) {
        com.learnsphere.ai.dto.QuestionGenerationResponse response = questionGenerationService
                .generateQuestions(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/grade")
    public ResponseEntity<com.learnsphere.ai.dto.GradingResponse> gradeAssignment(
            @RequestBody com.learnsphere.ai.dto.GradingRequest request) {
        com.learnsphere.ai.dto.GradingResponse response = aiGradingService.gradeAssignment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/grade-pdf")
    public ResponseEntity<com.learnsphere.ai.dto.GradingResponse> gradePdf(
            @RequestBody com.learnsphere.ai.dto.PdfGradingRequest request) {
        com.learnsphere.ai.dto.GradingResponse response = pdfGradingService.gradePdf(request);
        return ResponseEntity.ok(response);
    }
}
