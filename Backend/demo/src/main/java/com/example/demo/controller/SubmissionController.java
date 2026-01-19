// src/main/java/com/example/demo/controller/SubmissionController.java
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.Attachment;
import com.example.demo.dto.SubmissionMapper;
import com.example.demo.dto.Submissiondto;
import com.example.demo.model.Submission;
import com.example.demo.service.SubmissionService;
import com.example.demo.service.fileStorageService;


@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {


    @Autowired
    private SubmissionService submissionService;

    private fileStorageService fileStorageService;

     public SubmissionController(fileStorageService fileStorageService) {
    this.fileStorageService = fileStorageService;
}
    @GetMapping
    public List<Submission> getAllSubmissions() {
        return submissionService.getAllSubmissions();
    }

    @GetMapping("/{id}")
    public Submission getSubmissionById(@PathVariable String id) {
        return submissionService.getSubmissionById(id).get();
    }
    

        @GetMapping("/{assignmentid}/{studentid}")
        public ResponseEntity<Submission> getSubmissionByAssIdandStudId(
            @PathVariable String assignmentid, 
            @PathVariable String studentid) {
        Optional<Submission> submission = submissionService.getSubmissionByAssignmentIdAndStudentId(assignmentid, studentid);
        return submission.map(ResponseEntity::ok).orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<List<Submission>> getSubmissionsByAssignmentId(
            @PathVariable String assignmentId) {
        List<Submission> submissions = submissionService.getSubmissionsByAssignmentId(assignmentId);
        return ResponseEntity.ok(submissions);
    }

    @PostMapping(value = "/assignments/{assignmentId}/submissions",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Submission createSubmission(
        @RequestPart("formData") Submissiondto submissiondto,
        @RequestPart("attachments") List<MultipartFile> files,
        @PathVariable String assignmentId) {
        System.out.println("in the create submisiion\n\n\n");
        System.out.println("response:" + files);
        List<Attachment> attachments = fileStorageService.storeFiles(files);
        Submission submission = SubmissionMapper.toEntity(submissiondto , assignmentId); // convert DTO to entity
        submission.setAttachments(attachments);
        System.out.println("updated :" + submission.getAttachments());
        return submissionService.createSubmission(submission);
    }

    @PutMapping(value = "/assignments/{assignmentId}/submissions/{submissionId}" , consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Submission updateSubmission( @RequestPart("formData") Submissiondto submissiondto,
        @RequestPart("attachments") List<MultipartFile> files
        ,@PathVariable String assignmentId,
        @PathVariable String submissionId)
    {
        System.out.println("while updating\n\n\n ");
        Submission oldsubmission  = submissionService.findoldSubmission(submissionId);
        List<Attachment> attachments = fileStorageService.storeFiles(files);
        oldsubmission  = SubmissionMapper.updateEntity(oldsubmission,submissiondto);
        oldsubmission.setAttachments(attachments);  
        submissionService.updateSubmission(oldsubmission);
        return oldsubmission;
    }
@DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubmission(@PathVariable String id) {
        submissionService.deleteSubmission(id);
        return ResponseEntity.noContent().build();
    }

    // Additional endpoints for updating submissions, etc.
}