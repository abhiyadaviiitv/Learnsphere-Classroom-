package com.learnsphere.user.dto;

import java.util.Date;

public class Attachment {
    private String fileId;       // Unique identifier for the file
    private String fileName;    // Original file name
    private String fileType;    // MIME type (e.g., "application/pdf")
    private long fileSize;      // File size in bytes
    private String fileUrl;     // URL or path to access the file
    private Date uploadedDate;  // When the file was uploaded

    // Getters and Setters
    public String getFileId() {
        return fileId;
    }

    public void setFileId(String fileId) {
        this.fileId = fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public Date getUploadedDate() {
        return uploadedDate;
    }

    public void setUploadedDate(Date uploadedDate) {
        this.uploadedDate = uploadedDate;
    }
}



