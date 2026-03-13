package com.learnsphere.assignment.controller;

import java.util.List;

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

import com.learnsphere.assignment.dto.Assignmentdto;
import com.learnsphere.assignment.dto.AssignmentMapper;
import com.learnsphere.assignment.dto.Attachment;
import com.learnsphere.assignment.model.Assignment;
import com.learnsphere.assignment.service.AssignmentService;
import com.learnsphere.assignment.service.FileStorageService;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping
    public List<Assignment> getAllAssignments() {
        return assignmentService.getAllAssignments();
    }

    @GetMapping("/{classId}")
    public ResponseEntity<List<Assignment>> getAssignmentsByClassId(@PathVariable String classId) {
        List<Assignment> assignments = assignmentService.getAssignmentListByclassId(classId).orElse(List.of());

        if (assignments.isEmpty()) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.ok(assignments);
        }
    }

    @GetMapping("/details/{assignmentid}")
    public ResponseEntity<Assignment> findassignmentbyassignmentid(@PathVariable String assignmentid) {
        Assignment assignment = assignmentService.getAssignmentById(assignmentid);

        if (assignment == null || assignment.getId() == null) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.ok(assignment);
        }
    }

    @Autowired
    private com.learnsphere.assignment.client.AiServiceClient aiServiceClient;

    @PostMapping(value = "/{classid}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Assignment createAssignment(
            @RequestPart("formData") Assignmentdto assignmentDTO,
            @RequestPart("attachments") List<MultipartFile> files,
            @PathVariable String classid) {

        List<Attachment> attachments = fileStorageService.storeFiles(files);
        Assignment assignment = AssignmentMapper.toEntity(assignmentDTO, classid);
        assignment.setAttachments(attachments);

        Assignment savedAssignment = assignmentService.createAssignment(assignment);

        // Trigger AI Ingestion Asynchronously
        triggerAiIngestion(savedAssignment, attachments, classid);

        return savedAssignment;
    }

    private void triggerAiIngestion(Assignment assignment, List<Attachment> attachments, String classId) {
        new Thread(() -> {
            try {
                com.learnsphere.assignment.dto.DataIngestionRequest request = new com.learnsphere.assignment.dto.DataIngestionRequest();
                request.setClassId(classId);

                StringBuilder textContent = new StringBuilder();
                textContent.append("Assignment Title: ").append(assignment.getTitle()).append("\n");
                if (assignment.getDescription() != null) {
                    textContent.append("Description: ").append(assignment.getDescription()).append("\n");
                }
                if (assignment.getInstructions() != null) {
                    textContent.append("Instructions: ").append(assignment.getInstructions()).append("\n");
                }
                if (assignment.getQuestions() != null) {
                    textContent.append("Questions:\n");
                    assignment.getQuestions().forEach(q -> textContent.append("- ").append(q.getText()).append("\n"));
                }
                request.setTextContent(textContent.toString());

                if (attachments != null && !attachments.isEmpty()) {
                    List<String> pdfUrls = attachments.stream()
                            .map(Attachment::getFileUrl)
                            .filter(url -> url != null && url.toLowerCase().endsWith(".pdf"))
                            .toList();
                    request.setPdfUrls(pdfUrls);
                }

                aiServiceClient.ingestData(request);
            } catch (Exception e) {
                // Log error but don't fail the assignment creation
                System.err.println("Failed to trigger AI ingestion for assignment: " + assignment.getId() + ". Error: "
                        + e.getMessage());
            }
        }).start();
    }

    @DeleteMapping("/{classid}")
    public ResponseEntity<Void> deleteAssignment(@PathVariable String classid) {
        assignmentService.deleteAssignment(classid);
        return ResponseEntity.noContent().build();
    }
}
