package com.learnsphere.ai.dto;

import java.util.Map;

public class GradingRequest {
    private String question;
    private String studentAnswer;
    private String rubric;
    private Integer maxPoints;
    private Map<String, String> questionAnswers; // For multiple questions
    
    public GradingRequest() {}
    
    public String getQuestion() {
        return question;
    }
    
    public void setQuestion(String question) {
        this.question = question;
    }
    
    public String getStudentAnswer() {
        return studentAnswer;
    }
    
    public void setStudentAnswer(String studentAnswer) {
        this.studentAnswer = studentAnswer;
    }
    
    public String getRubric() {
        return rubric;
    }
    
    public void setRubric(String rubric) {
        this.rubric = rubric;
    }
    
    public Integer getMaxPoints() {
        return maxPoints;
    }
    
    public void setMaxPoints(Integer maxPoints) {
        this.maxPoints = maxPoints;
    }
    
    public Map<String, String> getQuestionAnswers() {
        return questionAnswers;
    }
    
    public void setQuestionAnswers(Map<String, String> questionAnswers) {
        this.questionAnswers = questionAnswers;
    }
}

