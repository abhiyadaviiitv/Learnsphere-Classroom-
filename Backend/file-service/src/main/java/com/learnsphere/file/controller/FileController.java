package com.learnsphere.file.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.learnsphere.file.dto.Attachment;
import com.learnsphere.file.service.FileStorageService;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<Attachment>> uploadFiles(@RequestPart("files") List<MultipartFile> files) {
        try {
            List<Attachment> attachments = fileStorageService.storeFiles(files);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(value = "/upload/single", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Attachment> uploadFile(@RequestPart("file") MultipartFile file) {
        try {
            Attachment attachment = fileStorageService.storeFile(file);
            if (attachment == null) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(attachment);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
