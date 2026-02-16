package com.learnsphere.assignment.model;

import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.learnsphere.assignment.dto.Attachment;
import com.learnsphere.assignment.dto.Question;

@Document(collection = "assignments")
public class Assignment {
    @Id
    private String id;
    private String classId;
    private String title;
    private String type;
    private int points;
    private Date dueDate;
    private String description;
    private String instructions;
    private List<Question> questions;
    private boolean allowLateSubmissions;
    private int latePenalty;
    private boolean showPointsToStudents;
    private boolean allowAttachments;
    private boolean allowComments;
    private List<Attachment> attachments;
    
    public List<Attachment> getAttachments() {
        return attachments;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public Date getDueDate() {
        return dueDate;
    }

    public void setDueDate(Date dueDate) {
        this.dueDate = dueDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }

    public boolean isAllowLateSubmissions() {
        return allowLateSubmissions;
    }

    public void setAllowLateSubmissions(boolean allowLateSubmissions) {
        this.allowLateSubmissions = allowLateSubmissions;
    }

    public int getLatePenalty() {
        return latePenalty;
    }

    public void setLatePenalty(int latePenalty) {
        this.latePenalty = latePenalty;
    }

    public boolean isShowPointsToStudents() {
        return showPointsToStudents;
    }

    public void setShowPointsToStudents(boolean showPointsToStudents) {
        this.showPointsToStudents = showPointsToStudents;
    }

    public boolean isAllowAttachments() {
        return allowAttachments;
    }

    public void setAllowAttachments(boolean allowAttachments) {
        this.allowAttachments = allowAttachments;
    }

    public boolean isAllowComments() {
        return allowComments;
    }

    public void setAllowComments(boolean allowComments) {
        this.allowComments = allowComments;
    }

    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments;
    }
}



