package com.learnsphere.ai.dto;

import java.util.List;

public class QuestionGenerationResponse {
    private List<GeneratedQuestion> questions;
    
    public QuestionGenerationResponse() {}
    
    public List<GeneratedQuestion> getQuestions() {
        return questions;
    }
    
    public void setQuestions(List<GeneratedQuestion> questions) {
        this.questions = questions;
    }
    
    public static class GeneratedQuestion {
        private String question;
        private String type; // "multiple-choice", "short-answer", "essay"
        private List<String> options; // For multiple choice
        private String correctAnswer;
        private Integer points;
        private String explanation;
        
        public GeneratedQuestion() {}
        
        public String getQuestion() {
            return question;
        }
        
        public void setQuestion(String question) {
            this.question = question;
        }
        
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
        
        public List<String> getOptions() {
            return options;
        }
        
        public void setOptions(List<String> options) {
            this.options = options;
        }
        
        public String getCorrectAnswer() {
            return correctAnswer;
        }
        
        public void setCorrectAnswer(String correctAnswer) {
            this.correctAnswer = correctAnswer;
        }
        
        public Integer getPoints() {
            return points;
        }
        
        public void setPoints(Integer points) {
            this.points = points;
        }
        
        public String getExplanation() {
            return explanation;
        }
        
        public void setExplanation(String explanation) {
            this.explanation = explanation;
        }
    }
}

