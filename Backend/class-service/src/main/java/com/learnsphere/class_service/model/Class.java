package com.learnsphere.class_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "classes")
public class Class {
    @Id
    private String id;
    private String name;
    private String teacherId;
    private List<String> studentIds;
    private String section;
    private String code;

    // Meeting integration fields
    private Boolean isLive = false;
    private String meetingRoomId;
    private java.util.Date meetingStartedAt;
    private String meetingStartedBy;

    // Getters and Setters
    public String getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public List<String> getStudentIds() {
        return studentIds;
    }

    public void setStudentIds(List<String> studentIds) {
        this.studentIds = studentIds;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public Boolean getIsLive() {
        return isLive != null ? isLive : false;
    }

    public void setIsLive(Boolean isLive) {
        this.isLive = isLive;
    }

    public String getMeetingRoomId() {
        return meetingRoomId;
    }

    public void setMeetingRoomId(String meetingRoomId) {
        this.meetingRoomId = meetingRoomId;
    }

    public java.util.Date getMeetingStartedAt() {
        return meetingStartedAt;
    }

    public void setMeetingStartedAt(java.util.Date meetingStartedAt) {
        this.meetingStartedAt = meetingStartedAt;
    }

    public String getMeetingStartedBy() {
        return meetingStartedBy;
    }

    public void setMeetingStartedBy(String meetingStartedBy) {
        this.meetingStartedBy = meetingStartedBy;
    }
}



