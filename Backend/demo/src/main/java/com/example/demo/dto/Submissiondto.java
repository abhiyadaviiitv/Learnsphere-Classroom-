// src/main/java/com/example/demo/model/Submission.java
package com.example.demo.dto;

import java.util.Date;

import java.util.Map;

import org.springframework.data.annotation.Id;


public class Submissiondto {
    @Id
    private String id;
    private String studentId;
    private Date submissionDate;
    private String content;
    private int score;
    private Map<String, String> questionAnswers;
    // private List<Attachment> attachments;
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
   
    public String getStudentId() {
        return studentId;
    }
    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }
    public Date getSubmissionDate() {
        return submissionDate;
    }
    public void setSubmissionDate(Date submissionDate) {
        this.submissionDate = submissionDate;
    }
    public String getContent() {
        return content;
    }
    public void setContent(String content) {
        this.content = content;
    }
    public int getScore() {
        return score;
    }
    public void setScore(int score) {
        this.score = score;
    }
    public Map<String, String> getQuestionAnswers() {
        return questionAnswers;
    }
    public void setQuestionAnswers(Map<String, String> questionAnswers) {
        this.questionAnswers = questionAnswers;
    }

    
}
