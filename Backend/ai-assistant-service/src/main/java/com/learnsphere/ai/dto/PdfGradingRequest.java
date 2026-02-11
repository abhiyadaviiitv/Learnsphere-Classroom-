package com.learnsphere.ai.dto;

public class PdfGradingRequest {
    private String referenceMaterialPath; // Path to reference PDF in uploads folder
    private String studentSubmissionPath; // Path to student PDF in uploads folder
    private String rubric;
    private Integer maxPoints;
    
    public PdfGradingRequest() {}
    
    public String getReferenceMaterialPath() {
        return referenceMaterialPath;
    }
    
    public void setReferenceMaterialPath(String referenceMaterialPath) {
        this.referenceMaterialPath = referenceMaterialPath;
    }
    
    public String getStudentSubmissionPath() {
        return studentSubmissionPath;
    }
    
    public void setStudentSubmissionPath(String studentSubmissionPath) {
        this.studentSubmissionPath = studentSubmissionPath;
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
}

