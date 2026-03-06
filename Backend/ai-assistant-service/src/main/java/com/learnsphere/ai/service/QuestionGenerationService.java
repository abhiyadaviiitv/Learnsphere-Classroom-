package com.learnsphere.ai.service;

import com.learnsphere.ai.dto.QuestionGenerationRequest;
import com.learnsphere.ai.dto.QuestionGenerationResponse;
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
public class QuestionGenerationService {

    private final ChatModel chatModel;

    @Autowired
    public QuestionGenerationService(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public QuestionGenerationResponse generateQuestions(QuestionGenerationRequest request) {
        try {
            String promptText = """
                    You are an educational content creator.

                    TASK: Generate {count} {difficulty} questions about {topic_or_resource}.

                    Type: {type}

                    {context_section}

                    Provide response in JSON:
                    {lb}
                        "questions": [
                            {lb}
                                "question": "...",
                                "type": "multiple-choice|short-answer",
                                "options": ["..."],
                                "correctAnswer": "...",
                                "points": 10,
                                "explanation": "..."
                            {rb}
                        ]
                    {rb}
                    """;

            String context = request.getContext();
            String topicOrResource = (context != null && !context.isEmpty())
                    ? "the provided RESOURCE CONTENT"
                    : "\"" + (request.getTopic() != null ? request.getTopic() : "general knowledge") + "\"";

            String contextSection = (context != null && !context.isEmpty())
                    ? "RESOURCE CONTENT:\n\"\"\"\n" + context + "\n\"\"\""
                    : "";

            PromptTemplate template = new PromptTemplate(promptText);
            Prompt prompt = template.create(Map.of(
                    "count", request.getNumberOfQuestions() != null ? request.getNumberOfQuestions() : 5,
                    "difficulty", request.getDifficulty() != null ? request.getDifficulty() : "medium",
                    "topic_or_resource", topicOrResource,
                    "context_section", contextSection,
                    "type", request.getQuestionType() != null ? request.getQuestionType() : "mixed",
                    "lb", "{",
                    "rb", "}"));

            String jsonResponse = chatModel.call(prompt).getResult().getOutput().getText();

            return parseQuestionResponse(jsonResponse);
        } catch (Exception e) {
            e.printStackTrace();
            QuestionGenerationResponse errorResponse = new QuestionGenerationResponse();
            errorResponse.setQuestions(new ArrayList<>());
            return errorResponse;
        }
    }

    private QuestionGenerationResponse parseQuestionResponse(String response) {
        QuestionGenerationResponse questionResponse = new QuestionGenerationResponse();
        List<QuestionGenerationResponse.GeneratedQuestion> questions = new ArrayList<>();

        try {
            // Extract JSON from response
            String jsonPart = extractJsonFromResponse(response);

            // Parse questions using regex (in production, use proper JSON parser)
            // Look for blocks starting with { and containing "question"
            // This is a naive regex parser for demonstration.
            // A library like Jackson would be much better here.

            // Temporary simple parsing logic:
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
