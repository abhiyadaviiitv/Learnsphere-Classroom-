package com.learnsphere.user.service;

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

import com.learnsphere.user.dto.Attachment;

@Service
public class FileStorageService {

    private final String UPLOAD_DIR = "../uploads";

    public List<Attachment> storeFiles(List<MultipartFile> files) {
        List<Attachment> attachments = new ArrayList<>();

        for (MultipartFile file : files) {
            String fileId = UUID.randomUUID().toString();
            String ext = Paths.get(file.getOriginalFilename()).getFileName().toString();
            String newFileUrl = fileId + "." + ext;

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
            attachment.setFileName(file.getOriginalFilename());
            attachment.setFileType(file.getContentType());
            attachment.setFileSize(file.getSize());
            attachment.setFileUrl("/uploads/" + newFileUrl);
            attachment.setUploadedDate(new Date());

            attachments.add(attachment);
        }

        return attachments;
    }
}



