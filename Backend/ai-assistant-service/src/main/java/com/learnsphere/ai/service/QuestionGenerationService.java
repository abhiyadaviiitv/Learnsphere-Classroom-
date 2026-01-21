package com.learnsphere.ai.service;

import com.learnsphere.ai.dto.QuestionGenerationRequest;
import com.learnsphere.ai.dto.QuestionGenerationResponse;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuestionGenerationService {

    @Autowired
    private ChatModel chatModel;

    public QuestionGenerationResponse generateQuestions(QuestionGenerationRequest request) {
        String prompt = buildQuestionGenerationPrompt(request);
        String response = chatModel.call(prompt);

        return parseQuestionResponse(response);
    }

    private String buildQuestionGenerationPrompt(QuestionGenerationRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert educator creating assignment questions. ");
        prompt.append("Generate high-quality questions based on the following requirements:\n\n");

        prompt.append("TOPIC: ").append(request.getTopic()).append("\n");
        prompt.append("DIFFICULTY: ").append(request.getDifficulty() != null ? request.getDifficulty() : "medium")
                .append("\n");
        prompt.append("NUMBER OF QUESTIONS: ")
                .append(request.getNumberOfQuestions() != null ? request.getNumberOfQuestions() : 5).append("\n");
        prompt.append("QUESTION TYPE: ").append(request.getQuestionType() != null ? request.getQuestionType() : "mixed")
                .append("\n\n");

        prompt.append("Please generate questions in the following JSON format:\n");
        prompt.append("{\n");
        prompt.append("  \"questions\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"question\": \"<question text>\",\n");
        prompt.append("      \"type\": \"<multiple-choice|short-answer|essay>\",\n");
        prompt.append("      \"options\": [\"<option1>\", \"<option2>\", ...], // Only for multiple-choice\n");
        prompt.append("      \"correctAnswer\": \"<correct answer>\",\n");
        prompt.append("      \"points\": <integer>,\n");
        prompt.append("      \"explanation\": \"<why this is correct>\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n\n");
        prompt.append("Make questions clear, relevant, and appropriate for the difficulty level.");

        return prompt.toString();
    }

    private QuestionGenerationResponse parseQuestionResponse(String response) {
        QuestionGenerationResponse questionResponse = new QuestionGenerationResponse();
        List<QuestionGenerationResponse.GeneratedQuestion> questions = new ArrayList<>();

        try {
            // Extract JSON from response
            String jsonPart = extractJsonFromResponse(response);

            // Parse questions using regex (in production, use proper JSON parser)
            Pattern questionPattern = Pattern.compile("\\{[^}]*\"question\"\\s*:\\s*\"([^\"]+)\"[^}]*\\}",
                    Pattern.DOTALL);
            Matcher questionMatcher = questionPattern.matcher(jsonPart);

            while (questionMatcher.find()) {
                String questionBlock = questionMatcher.group(0);
                QuestionGenerationResponse.GeneratedQuestion question = parseQuestion(questionBlock);
                if (question != null) {
                    questions.add(question);
                }
            }

            // If regex parsing fails, try to extract from text
            if (questions.isEmpty()) {
                questions = extractQuestionsFromText(response);
            }

        } catch (Exception e) {
            // Fallback: extract questions from plain text
            questions = extractQuestionsFromText(response);
        }

        questionResponse.setQuestions(questions);
        return questionResponse;
    }

    private String extractJsonFromResponse(String response) {
        int start = response.indexOf("{");
        int end = response.lastIndexOf("}") + 1;
        if (start >= 0 && end > start) {
            return response.substring(start, end);
        }
        return response;
    }

    private QuestionGenerationResponse.GeneratedQuestion parseQuestion(String questionBlock) {
        try {
            QuestionGenerationResponse.GeneratedQuestion question = new QuestionGenerationResponse.GeneratedQuestion();

            // Extract question text
            Pattern pattern = Pattern.compile("\"question\"\\s*:\\s*\"([^\"]+)\"");
            Matcher matcher = pattern.matcher(questionBlock);
            if (matcher.find()) {
                question.setQuestion(matcher.group(1));
            }

            // Extract type
            pattern = Pattern.compile("\"type\"\\s*:\\s*\"([^\"]+)\"");
            matcher = pattern.matcher(questionBlock);
            if (matcher.find()) {
                question.setType(matcher.group(1));
            } else {
                question.setType("short-answer");
            }

            // Extract correct answer
            pattern = Pattern.compile("\"correctAnswer\"\\s*:\\s*\"([^\"]+)\"");
            matcher = pattern.matcher(questionBlock);
            if (matcher.find()) {
                question.setCorrectAnswer(matcher.group(1));
            }

            // Extract points
            pattern = Pattern.compile("\"points\"\\s*:\\s*(\\d+)");
            matcher = pattern.matcher(questionBlock);
            if (matcher.find()) {
                question.setPoints(Integer.parseInt(matcher.group(1)));
            } else {
                question.setPoints(10);
            }

            // Extract explanation
            pattern = Pattern.compile("\"explanation\"\\s*:\\s*\"([^\"]+)\"");
            matcher = pattern.matcher(questionBlock);
            if (matcher.find()) {
                question.setExplanation(matcher.group(1));
            }

            // Extract options for multiple choice
            if ("multiple-choice".equals(question.getType())) {
                List<String> options = new ArrayList<>();
                pattern = Pattern.compile("\"options\"\\s*:\\s*\\[([^\\]]+)\\]");
                matcher = pattern.matcher(questionBlock);
                if (matcher.find()) {
                    String optionsStr = matcher.group(1);
                    Pattern optionPattern = Pattern.compile("\"([^\"]+)\"");
                    Matcher optionMatcher = optionPattern.matcher(optionsStr);
                    while (optionMatcher.find()) {
                        options.add(optionMatcher.group(1));
                    }
                }
                question.setOptions(options);
            }

            return question;
        } catch (Exception e) {
            return null;
        }
    }

    private List<QuestionGenerationResponse.GeneratedQuestion> extractQuestionsFromText(String text) {
        List<QuestionGenerationResponse.GeneratedQuestion> questions = new ArrayList<>();

        // Simple extraction: look for numbered questions
        Pattern pattern = Pattern.compile(
                "(?:^|\\n)\\s*(?:\\d+[.)]|Q\\d+[:.]?)\\s*(.+?)(?=\\n\\s*(?:\\d+[.)]|Q\\d+[:.]?)|$)",
                Pattern.MULTILINE | Pattern.DOTALL);
        Matcher matcher = pattern.matcher(text);

        int questionNum = 1;
        while (matcher.find() && questionNum <= 10) {
            String questionText = matcher.group(1).trim();
            if (questionText.length() > 10) { // Valid question
                QuestionGenerationResponse.GeneratedQuestion question = new QuestionGenerationResponse.GeneratedQuestion();
                question.setQuestion(questionText);
                question.setType("short-answer");
                question.setPoints(10);
                questions.add(question);
                questionNum++;
            }
        }

        return questions;
    }
}
