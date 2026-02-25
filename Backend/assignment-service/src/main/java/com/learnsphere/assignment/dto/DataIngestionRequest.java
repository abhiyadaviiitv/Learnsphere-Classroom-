package com.learnsphere.assignment.dto;

import java.util.List;

public class DataIngestionRequest {
    private String classId;
    private String textContent; // General text like assignment description, instructions
    private List<String> pdfUrls; // List of S3 URLs to process

    public DataIngestionRequest() {
    }

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }

    public List<String> getPdfUrls() {
        return pdfUrls;
    }

    public void setPdfUrls(List<String> pdfUrls) {
        this.pdfUrls = pdfUrls;
    }
}
