package com.learnsphere.ai.service;

import com.learnsphere.ai.dto.GradingRequest;
import com.learnsphere.ai.dto.GradingResponse;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiGradingService {

    @Autowired
    private ChatModel chatModel;

    public GradingResponse gradeSubmission(GradingRequest request) {
        String prompt = buildGradingPrompt(request);

        String response = chatModel.call(prompt);

        return parseGradingResponse(response, request.getMaxPoints());
    }

    private String buildGradingPrompt(GradingRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert teacher grading a student's submission. ");
        prompt.append("Evaluate the student's answer based on the question and provide a fair grade.\n\n");

        prompt.append("QUESTION:\n");
        prompt.append(request.getQuestion()).append("\n\n");

        prompt.append("STUDENT ANSWER:\n");
        prompt.append(request.getStudentAnswer()).append("\n\n");

        if (request.getRubric() != null && !request.getRubric().isEmpty()) {
            prompt.append("GRADING RUBRIC:\n");
            prompt.append(request.getRubric()).append("\n\n");
        }

        int maxPoints = request.getMaxPoints() != null ? request.getMaxPoints() : 100;
        prompt.append("Maximum Points: ").append(maxPoints).append("\n\n");

        prompt.append("Please provide your evaluation in the following JSON format:\n");
        prompt.append("{\n");
        prompt.append("  \"suggestedScore\": <integer between 0 and ").append(maxPoints).append(">,\n");
        prompt.append("  \"feedback\": \"<overall feedback>\",\n");
        prompt.append("  \"feedbackItems\": [\"<item1>\", \"<item2>\", ...],\n");
        prompt.append("  \"reasoning\": \"<brief explanation of the score>\"\n");
        prompt.append("}\n\n");
        prompt.append("Be fair but thorough. Consider correctness, completeness, clarity, and effort.");

        return prompt.toString();
    }

    private GradingResponse parseGradingResponse(String response, Integer maxPoints) {
        GradingResponse gradingResponse = new GradingResponse();

        try {
            // Try to extract JSON from response
            String jsonPart = extractJsonFromResponse(response);

            // Simple JSON parsing (in production, use proper JSON parser)
            // For now, we'll use a more robust approach with regex
            int score = extractScore(jsonPart, maxPoints);
            String feedback = extractField(jsonPart, "feedback");
            List<String> feedbackItems = extractFeedbackItems(jsonPart);
            String reasoning = extractField(jsonPart, "reasoning");

            gradingResponse.setSuggestedScore(score);
            gradingResponse.setFeedback(feedback);
            gradingResponse.setFeedbackItems(feedbackItems);
            gradingResponse.setReasoning(reasoning);

        } catch (Exception e) {
            // Fallback: parse manually from text
            gradingResponse.setSuggestedScore(estimateScoreFromText(response, maxPoints));
            gradingResponse.setFeedback(response);
            gradingResponse.setFeedbackItems(List.of("See feedback for details"));
            gradingResponse.setReasoning("AI analysis completed");
        }

        return gradingResponse;
    }

    private String extractJsonFromResponse(String response) {
        // Find JSON object in response
        int start = response.indexOf("{");
        int end = response.lastIndexOf("}") + 1;
        if (start >= 0 && end > start) {
            return response.substring(start, end);
        }
        return response;
    }

    private int extractScore(String json, Integer maxPoints) {
        // Extract score using regex
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"suggestedScore\"\\s*:\\s*(\\d+)");
        java.util.regex.Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            int score = Integer.parseInt(matcher.group(1));
            return Math.min(score, maxPoints != null ? maxPoints : 100);
        }
        return maxPoints != null ? maxPoints / 2 : 50; // Default to half points
    }

    private String extractField(String json, String fieldName) {
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"" + fieldName + "\"\\s*:\\s*\"([^\"]+)\"");
        java.util.regex.Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "No " + fieldName + " provided";
    }

    private List<String> extractFeedbackItems(String json) {
        List<String> items = new ArrayList<>();
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"([^\"]+)\"");
        java.util.regex.Matcher matcher = pattern.matcher(json);

        // Find the feedbackItems array
        int itemsStart = json.indexOf("\"feedbackItems\"");
        if (itemsStart >= 0) {
            int arrayStart = json.indexOf("[", itemsStart);
            int arrayEnd = json.indexOf("]", arrayStart);
            if (arrayStart >= 0 && arrayEnd > arrayStart) {
                String arrayContent = json.substring(arrayStart + 1, arrayEnd);
                matcher = pattern.matcher(arrayContent);
                while (matcher.find()) {
                    items.add(matcher.group(1));
                }
            }
        }

        if (items.isEmpty()) {
            items.add("See feedback for details");
        }

        return items;
    }

    private int estimateScoreFromText(String text, Integer maxPoints) {
        // Simple heuristic: look for score mentions
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d+)\\s*(?:out of|/|points?)",
                java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return maxPoints != null ? maxPoints / 2 : 50;
    }
}
