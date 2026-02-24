package com.learnsphere.ai.service;

import com.learnsphere.ai.dto.GradingResponse;
import com.learnsphere.ai.dto.PdfGradingRequest;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PdfGradingService {

    private final ChatModel chatModel;

    @Autowired
    private PdfProcessingService pdfProcessingService;

    @Autowired
    public PdfGradingService(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public GradingResponse gradePdf(PdfGradingRequest request) {
        try {
            // Extract text from reference material PDF
            String referenceText = pdfProcessingService.extractTextFromPdf(request.getReferenceMaterialPath());

            // Extract text from student submission PDF
            String studentText = pdfProcessingService.extractTextFromPdf(request.getStudentSubmissionPath());

            // Build grading prompt with context using PromptTemplate
            String promptTemplateString = """
                    You are an expert teacher grading a student's PDF submission.
                    Use the provided reference material as context to evaluate the student's work.

                    REFERENCE MATERIAL (Context for grading):
                    ---
                    {referenceMaterial}
                    ---

                    STUDENT SUBMISSION:
                    ---
                    {studentSubmission}
                    ---

                    {rubricSection}

                    Maximum Points: {maxPoints}

                    Please evaluate the student's submission based on:
                    1. How well it addresses the reference material
                    2. Accuracy and completeness
                    3. Understanding demonstrated
                    4. Quality of work

                    Provide your evaluation in the following JSON format:
                    {lb}
                      "suggestedScore": (integer between 0 and {maxPoints}),
                      "feedback": "(overall feedback)",
                      "feedbackItems": ["(item1)", "(item2)", "..."],
                      "reasoning": "(brief explanation of the score)"
                    {rb}
                    Be thorough and fair in your evaluation.
                    """;

            String rubricSection = "";
            if (request.getRubric() != null && !request.getRubric().isEmpty()) {
                rubricSection = "GRADING RUBRIC:\\n" + request.getRubric() + "\\n\\n";
            }

            int maxPoints = request.getMaxPoints() != null ? request.getMaxPoints() : 100;

            PromptTemplate template = new PromptTemplate(promptTemplateString);
            Prompt prompt = template.create(Map.of(
                    "referenceMaterial", referenceText.substring(0, Math.min(referenceText.length(), 5000)),
                    "studentSubmission", studentText.substring(0, Math.min(studentText.length(), 5000)),
                    "rubricSection", rubricSection,
                    "maxPoints", maxPoints,
                    "lb", "{",
                    "rb", "}"));

            String jsonResponse = chatModel.call(prompt).getResult().getOutput().getText();

            // Parse and return grading response
            return parseGradingResponse(jsonResponse, request.getMaxPoints());

        } catch (Exception e) {
            e.printStackTrace(); // Log the error
            GradingResponse errorResponse = new GradingResponse();
            errorResponse.setSuggestedScore(0);
            errorResponse.setFeedback("Error grading PDF submission: " + e.getMessage());
            errorResponse.setFeedbackItems(new ArrayList<>());
            return errorResponse;
        }
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
