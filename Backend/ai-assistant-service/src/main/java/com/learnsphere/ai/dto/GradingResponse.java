package com.learnsphere.ai.dto;

import java.util.List;

public class GradingResponse {
    private Integer suggestedScore;
    private String feedback;
    private List<String> feedbackItems;
    private String reasoning;
    
    public GradingResponse() {}
    
    public Integer getSuggestedScore() {
        return suggestedScore;
    }
    
    public void setSuggestedScore(Integer suggestedScore) {
        this.suggestedScore = suggestedScore;
    }
    
    public String getFeedback() {
        return feedback;
    }
    
    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
    
    public List<String> getFeedbackItems() {
        return feedbackItems;
    }
    
    public void setFeedbackItems(List<String> feedbackItems) {
        this.feedbackItems = feedbackItems;
    }
    
    public String getReasoning() {
        return reasoning;
    }
    
    public void setReasoning(String reasoning) {
        this.reasoning = reasoning;
    }
}

