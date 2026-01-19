package com.example.demo.dto;

import com.example.demo.model.Assignment;

public class assignmentMapper {

    public static Assignment toEntity(Assignmentdto dto,String classid) {
        Assignment assignment =  new Assignment();
       assignment.setTitle(dto.getTitle());
        assignment.setType(dto.getType());
        assignment.setPoints(dto.getPoints());
        assignment.setDueDate(dto.getDueDate());
        assignment.setDescription(dto.getDescription());
        assignment.setInstructions(dto.getInstructions());
        assignment.setAllowLateSubmissions(dto.isAllowLateSubmissions());
        assignment.setLatePenalty(dto.getLatePenalty());
        assignment.setShowPointsToStudents(dto.isShowPointsToStudents());
        assignment.setAllowAttachments(dto.isAllowAttachments());
        assignment.setAllowComments(dto.isAllowComments());
        assignment.setQuestions(dto.getQuestions());
        assignment.setClassId(classid);
        return assignment;
    }


    
}
