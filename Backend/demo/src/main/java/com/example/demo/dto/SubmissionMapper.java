package com.example.demo.dto;

import java.util.Date;

import com.example.demo.model.Submission;


public class SubmissionMapper {
    public static Submission toEntity(Submissiondto dto , String assignmentId)
    {
        Submission s = new Submission();
        s.setAssignmentId(assignmentId);
        s.setId(dto.getId());
        s.setContent(dto.getContent());
        s.setStudentId(dto.getStudentId());
        s.setScore(dto.getScore());
        Date d = new Date();
        s.setSubmissionDate(d);
        s.setQuestionAnswers(dto.getQuestionAnswers());

        return s;
    }

    public static Submission updateEntity(Submission oldsubmission , Submissiondto dto) {
        System.out.println("in the update entity \n\n\n\n");
        oldsubmission.setContent(dto.getContent());
        oldsubmission.setScore(dto.getScore());
        Date d = new Date();
        oldsubmission.setSubmissionDate(d);
        oldsubmission.setQuestionAnswers(dto.getQuestionAnswers());
        return oldsubmission;
    }

    
}
