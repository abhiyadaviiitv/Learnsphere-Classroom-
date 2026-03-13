package com.learnsphere.submission.service;

import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.learnsphere.submission.client.FileServiceClient;
import com.learnsphere.submission.dto.Attachment;

@Service
public class FileStorageService {

    @Autowired
    private FileServiceClient fileServiceClient;

    public List<Attachment> storeFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return Collections.emptyList();
        }

        // Remove empty files before forwarding
        List<MultipartFile> validFiles = files.stream()
                .filter(f -> !f.isEmpty())
                .toList();

        if (validFiles.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            // Forward files to File Service
            return fileServiceClient.uploadFiles(validFiles);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to upload files via File Service: " + e.getMessage(), e);
        }
    }
}
