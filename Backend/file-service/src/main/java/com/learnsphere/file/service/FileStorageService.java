package com.learnsphere.file.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import com.learnsphere.file.dto.Attachment;

@Service
public class FileStorageService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String awsRegion;

    public FileStorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

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
            String s3Key = "uploads/" + fileId + ext;

            try {
                PutObjectRequest putOb = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(s3Key)
                        .contentType(file.getContentType())
                        .build();

                s3Client.putObject(putOb, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

                // Construct the public S3 URL
                String s3Url = String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, awsRegion, s3Key);

                Attachment attachment = new Attachment();
                attachment.setFileId(fileId);
                attachment.setFileName(originalFilename);
                attachment.setFileType(file.getContentType());
                attachment.setFileSize(file.getSize());
                attachment.setFileUrl(s3Url);
                attachment.setUploadedDate(new Date());

                attachments.add(attachment);

            } catch (IOException e) {
                e.printStackTrace();
                throw new RuntimeException("Failed to process file input stream: " + e.getMessage(), e);
            } catch (Exception e) {
                e.printStackTrace();
                throw new RuntimeException("S3 upload failed: " + e.getMessage(), e);
            }
        }

        return attachments;
    }

    public Attachment storeFile(MultipartFile file) {
        List<Attachment> attachments = storeFiles(List.of(file));
        return attachments.isEmpty() ? null : attachments.get(0);
    }
}
