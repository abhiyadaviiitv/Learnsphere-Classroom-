package com.learnsphere.file.controller;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    private final String UPLOAD_DIR = "../uploads";

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<Attachment>> uploadFiles(@RequestPart("files") List<MultipartFile> files) {
        try {
            List<Attachment> attachments = fileStorageService.storeFiles(files);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/uploads/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            // Determine if it's an image file
            String lowerFilename = filename.toLowerCase();
            boolean isImage = lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg") 
                    || lowerFilename.endsWith(".png") || lowerFilename.endsWith(".gif") 
                    || lowerFilename.endsWith(".bmp") || lowerFilename.endsWith(".webp")
                    || lowerFilename.endsWith(".svg");

            if (isImage) {
                // Serve images inline (for viewing in browser)
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, getContentType(filename))
                        .body(resource);
            } else {
                // Serve other files as downloads
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + resource.getFilename() + "\"")
                        .header(HttpHeaders.CONTENT_TYPE, getContentType(filename))
                        .body(resource);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String getContentType(String filename) {
        String lowerFilename = filename.toLowerCase();
        if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerFilename.endsWith(".png")) {
            return "image/png";
        } else if (lowerFilename.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerFilename.endsWith(".pdf")) {
            return "application/pdf";
        } else if (lowerFilename.endsWith(".doc") || lowerFilename.endsWith(".docx")) {
            return "application/msword";
        } else if (lowerFilename.endsWith(".xls") || lowerFilename.endsWith(".xlsx")) {
            return "application/vnd.ms-excel";
        } else if (lowerFilename.endsWith(".zip")) {
            return "application/zip";
        } else {
            return "application/octet-stream";
        }
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileId) {
        // This would require a database to map fileId to filename
        // For now, we'll use the download endpoint with filename
        return ResponseEntity.notFound().build();
    }
}

