package com.learnsphere.ai.service;

import com.learnsphere.ai.dto.GradingResponse;
import com.learnsphere.ai.dto.PdfGradingRequest;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PdfGradingService {

    @Autowired
    private ChatModel chatModel;

    @Autowired
    private PdfProcessingService pdfProcessingService;

    public GradingResponse gradePdfSubmission(PdfGradingRequest request) {
        try {
            // Extract text from reference material PDF
            String referenceText = pdfProcessingService.extractTextFromPdf(request.getReferenceMaterialPath());

            // Extract text from student submission PDF
            String studentText = pdfProcessingService.extractTextFromPdf(request.getStudentSubmissionPath());

            // Build grading prompt with context
            String prompt = buildPdfGradingPrompt(referenceText, studentText, request);

            // Get AI response
            String response = chatModel.call(prompt);

            // Parse and return grading response
            return parseGradingResponse(response, request.getMaxPoints());

        } catch (Exception e) {
            throw new RuntimeException("Error grading PDF submission: " + e.getMessage(), e);
        }
    }

    private String buildPdfGradingPrompt(String referenceText, String studentText, PdfGradingRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert teacher grading a student's PDF submission. ");
        prompt.append("Use the provided reference material as context to evaluate the student's work.\n\n");

        prompt.append("REFERENCE MATERIAL (Context for grading):\n");
        prompt.append("---\n");
        prompt.append(referenceText.substring(0, Math.min(referenceText.length(), 5000))); // Limit context size
        if (referenceText.length() > 5000) {
            prompt.append("\n... (truncated for length)");
        }
        prompt.append("\n---\n\n");

        prompt.append("STUDENT SUBMISSION:\n");
        prompt.append("---\n");
        prompt.append(studentText.substring(0, Math.min(studentText.length(), 5000))); // Limit context size
        if (studentText.length() > 5000) {
            prompt.append("\n... (truncated for length)");
        }
        prompt.append("\n---\n\n");

        if (request.getRubric() != null && !request.getRubric().isEmpty()) {
            prompt.append("GRADING RUBRIC:\n");
            prompt.append(request.getRubric()).append("\n\n");
        }

        int maxPoints = request.getMaxPoints() != null ? request.getMaxPoints() : 100;
        prompt.append("Maximum Points: ").append(maxPoints).append("\n\n");

        prompt.append("Please evaluate the student's submission based on:\n");
        prompt.append("1. How well it addresses the reference material\n");
        prompt.append("2. Accuracy and completeness\n");
        prompt.append("3. Understanding demonstrated\n");
        prompt.append("4. Quality of work\n\n");

        prompt.append("Provide your evaluation in the following JSON format:\n");
        prompt.append("{\n");
        prompt.append("  \"suggestedScore\": <integer between 0 and ").append(maxPoints).append(">,\n");
        prompt.append("  \"feedback\": \"<overall feedback>\",\n");
        prompt.append("  \"feedbackItems\": [\"<item1>\", \"<item2>\", ...],\n");
        prompt.append("  \"reasoning\": \"<brief explanation of the score>\"\n");
        prompt.append("}\n\n");
        prompt.append("Be thorough and fair in your evaluation.");

        return prompt.toString();
    }

    private GradingResponse parseGradingResponse(String response, Integer maxPoints) {
        GradingResponse gradingResponse = new GradingResponse();

        try {
            String jsonPart = extractJsonFromResponse(response);

            int score = extractScore(jsonPart, maxPoints);
            String feedback = extractField(jsonPart, "feedback");
            List<String> feedbackItems = extractFeedbackItems(jsonPart);
            String reasoning = extractField(jsonPart, "reasoning");

            gradingResponse.setSuggestedScore(score);
            gradingResponse.setFeedback(feedback);
            gradingResponse.setFeedbackItems(feedbackItems);
            gradingResponse.setReasoning(reasoning);

        } catch (Exception e) {
            gradingResponse.setSuggestedScore(maxPoints != null ? maxPoints / 2 : 50);
            gradingResponse.setFeedback(response);
            gradingResponse.setFeedbackItems(List.of("See feedback for details"));
            gradingResponse.setReasoning("AI analysis completed");
        }

        return gradingResponse;
    }

    private String extractJsonFromResponse(String response) {
        int start = response.indexOf("{");
        int end = response.lastIndexOf("}") + 1;
        if (start >= 0 && end > start) {
            return response.substring(start, end);
        }
        return response;
    }

    private int extractScore(String json, Integer maxPoints) {
        Pattern pattern = Pattern.compile("\"suggestedScore\"\\s*:\\s*(\\d+)");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            int score = Integer.parseInt(matcher.group(1));
            return Math.min(score, maxPoints != null ? maxPoints : 100);
        }
        return maxPoints != null ? maxPoints / 2 : 50;
    }

    private String extractField(String json, String fieldName) {
        Pattern pattern = Pattern.compile("\"" + fieldName + "\"\\s*:\\s*\"([^\"]+)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "No " + fieldName + " provided";
    }

    private List<String> extractFeedbackItems(String json) {
        List<String> items = new ArrayList<>();
        int itemsStart = json.indexOf("\"feedbackItems\"");
        if (itemsStart >= 0) {
            int arrayStart = json.indexOf("[", itemsStart);
            int arrayEnd = json.indexOf("]", arrayStart);
            if (arrayStart >= 0 && arrayEnd > arrayStart) {
                String arrayContent = json.substring(arrayStart + 1, arrayEnd);
                Pattern optionPattern = Pattern.compile("\"([^\"]+)\"");
                Matcher optionMatcher = optionPattern.matcher(arrayContent);
                while (optionMatcher.find()) {
                    items.add(optionMatcher.group(1));
                }
            }
        }

        if (items.isEmpty()) {
            items.add("See feedback for details");
        }

        return items;
    }
}
