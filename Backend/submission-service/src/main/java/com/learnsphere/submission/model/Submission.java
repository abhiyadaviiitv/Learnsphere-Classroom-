package com.learnsphere.submission.model;

import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.learnsphere.submission.dto.Attachment;

@Document(collection = "submissions")
public class Submission {
    @Id
    private String id;
    private String assignmentId;
    private String studentId;
    private Date submissionDate;
    private String content;
    private int score;
    private List<Attachment> attachments;
    private Map<String, String> questionAnswers;
    
    public Map<String, String> getQuestionAnswers() {
        return questionAnswers;
    }
    
    public void setQuestionAnswers(Map<String, String> questionAnswers) {
        this.questionAnswers = questionAnswers;
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public List<Attachment> getAttachments() {
        return attachments;
    }
    
    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments;
    }
    
    public String getAssignmentId() {
        return assignmentId;
    }
    
    public void setAssignmentId(String assignmentId) {
        this.assignmentId = assignmentId;
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
}



