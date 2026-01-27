// src/main/java/com/example/demo/controller/AssignmentController.java
package com.example.demo.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.Assignmentdto;
import com.example.demo.dto.Attachment;
import com.example.demo.dto.assignmentMapper;
import com.example.demo.model.Assignment;
import com.example.demo.service.AssignmentService;
import com.example.demo.service.fileStorageService;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {
 
    @Autowired
    private AssignmentService assignmentService;

    
    private fileStorageService fileStorageService;

    public AssignmentController(fileStorageService fileStorageService) {
    this.fileStorageService = fileStorageService;
}


    @GetMapping
    public List<Assignment> getAllAssignments() {
        return assignmentService.getAllAssignments();
    }

    
@GetMapping("/{classId}")
public ResponseEntity<List<Assignment>> getAssignmentsByClassId(@PathVariable String classId) {
    System.out.println("Fetching assignments for class ID: " + classId);
    
    List<Assignment> assignments = assignmentService.getAssignmentListByclassId(classId).get();
    
    if (assignments.isEmpty()) {
        return ResponseEntity.noContent().build();  // or return ResponseEntity.notFound().build();
    } else {
        return ResponseEntity.ok(assignments);
    }
}

    @GetMapping("/details/{assignmentid}")
    public ResponseEntity<Assignment> findassignmentbyassignmentid(@PathVariable String assignmentid)
    {
    System.out.println("Fetching assignments for Assignment ID: " + assignmentid);
    
    Assignment assignments = assignmentService.getAssignmentById(assignmentid);
    System.out.println(assignments.getTitle());
    if (assignments.getId() == null) {
        return ResponseEntity.noContent().build();  // or return ResponseEntity.notFound().build();
    } else {
        return ResponseEntity.ok(assignments);
    }
    }
    @PostMapping(value = "/{classid}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public Assignment createAssignment(
        @RequestPart("formData") Assignmentdto assignmentDTO,
        @RequestPart("attachments") List<MultipartFile> files,
        @PathVariable String classid) {
        
        System.out.println(files);
    List<Attachment> attachments = fileStorageService.storeFiles(files);
    System.out.println("response:" + attachments);
    Assignment assignment = assignmentMapper.toEntity(assignmentDTO,classid); // convert DTO to entity
    assignment.setAttachments(attachments);
    System.out.println("updated :" + assignment.getAttachments());


        return assignmentService.createAssignment(assignment);
    }

    @DeleteMapping("/{classid}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable String classid) {
        assignmentService.deleteAssignment(classid);
        return ResponseEntity.noContent().build();
    }

    // Additional endpoints for updating assignments, etc.
}