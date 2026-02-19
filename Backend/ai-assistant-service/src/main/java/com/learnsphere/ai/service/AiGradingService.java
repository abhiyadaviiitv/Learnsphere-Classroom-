package com.learnsphere.ai.service;

import com.learnsphere.ai.dto.GradingRequest;
import com.learnsphere.ai.dto.GradingResponse;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Map;

@Service
public class AiGradingService {

    private final ChatModel chatModel;

    @Autowired
    public AiGradingService(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public GradingResponse gradeAssignment(GradingRequest request) {
        try {
            String promptTemplateString = """
                    You are an expert academic grader. Grade the following submission based on the provided question, rubric, and reference answer.

                    QUESTION:
                    {question}

                    {correct_answer_section}

                    RUBRIC:
                    {rubric}

                    STUDENT SUBMISSION:
                    {submission}

                    Maximum Points: {maxPoints}

                    Please evaluate the student's submission based on:
                    1. Accuracy (compared to the reference answer if provided)
                    2. Completeness
                    3. Clarity

                    Provide your evaluation in the following JSON format:
                    {lb}
                      "suggestedScore": (integer between 0 and {maxPoints}),
                      "feedback": "(overall feedback)",
                      "feedbackItems": ["(item1)", "(item2)", "..."],
                      "reasoning": "(brief explanation of the score)"
                    {rb}
                    """;

            String correctAnswer = request.getCorrectAnswer();
            String correctAnswerSection = (correctAnswer != null && !correctAnswer.isEmpty())
                    ? "REFERENCE ANSWER (Correct Solution):\n" + correctAnswer + "\n"
                    : "";

            int maxPoints = request.getMaxPoints() != null ? request.getMaxPoints() : 100;

            PromptTemplate template = new PromptTemplate(promptTemplateString);
            Prompt prompt = template.create(Map.of(
                    "question", request.getQuestion(),
                    "correct_answer_section", correctAnswerSection,
                    "rubric", request.getRubric() != null ? request.getRubric() : "Standard academic grading standards",
                    "submission", request.getStudentAnswer(),
                    "maxPoints", maxPoints,
                    "lb", "{",
                    "rb", "}"));

            String jsonResponse = chatModel.call(prompt).getResult().getOutput().getText();

            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(jsonResponse, GradingResponse.class);

        } catch (Exception e) {
            e.printStackTrace();
            GradingResponse errorResponse = new GradingResponse();
            errorResponse.setSuggestedScore(0);
            errorResponse.setFeedback("Error: " + e.getMessage());
            errorResponse.setFeedbackItems(new ArrayList<>());
            return errorResponse;
        }
    }
}
