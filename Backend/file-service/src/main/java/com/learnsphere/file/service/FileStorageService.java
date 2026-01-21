package com.learnsphere.file.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.learnsphere.file.dto.Attachment;

@Service
public class FileStorageService {

    private final String UPLOAD_DIR = "../uploads";

    public List<Attachment> storeFiles(List<MultipartFile> files) {
        List<Attachment> attachments = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                continue;
            }

            String fileId = UUID.randomUUID().toString();
            String originalFilename = file.getOriginalFilename();
            String ext = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String newFileUrl = fileId + ext;

            Path uploadPath = Paths.get(UPLOAD_DIR);

            try {
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                Path path = uploadPath.resolve(newFileUrl);
                Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                e.printStackTrace();
                throw new RuntimeException("File upload failed: " + e.getMessage(), e);
            }

            Attachment attachment = new Attachment();
            attachment.setFileId(fileId);
            attachment.setFileName(originalFilename);
            attachment.setFileType(file.getContentType());
            attachment.setFileSize(file.getSize());
            attachment.setFileUrl("/uploads/" + newFileUrl);
            attachment.setUploadedDate(new Date());

            attachments.add(attachment);
        }

        return attachments;
    }

    public Attachment storeFile(MultipartFile file) {
        List<Attachment> attachments = storeFiles(List.of(file));
        return attachments.isEmpty() ? null : attachments.get(0);
    }
}


