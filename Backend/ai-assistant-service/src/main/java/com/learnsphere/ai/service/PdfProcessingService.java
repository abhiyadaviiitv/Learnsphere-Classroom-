package com.learnsphere.ai.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.IOException;
import java.net.URI;

@Service
public class PdfProcessingService {

    private final S3Client s3Client;
    private final org.springframework.web.client.RestTemplate restTemplate;

    @Value("${aws.s3.bucket-name:learnsphere-files1}")
    private String bucketName;

    @Autowired
    public PdfProcessingService(S3Client s3Client) {
        this.s3Client = s3Client;
        this.restTemplate = new org.springframework.web.client.RestTemplate();
    }

    /**
     * Extract text from a PDF file stored in S3 or accessible via URL
     * 
     * @param fileUrl The full URL to the PDF file
     * @return Extracted text from PDF
     */
    public String extractTextFromPdf(String fileUrl) {
        byte[] pdfBytes = null;

        try {
            if (isS3Url(fileUrl)) {
                String key = extractS3Key(fileUrl);
                GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build();
                ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(getObjectRequest);
                pdfBytes = objectBytes.asByteArray();
            } else {
                pdfBytes = restTemplate.getForObject(fileUrl, byte[].class);
            }

            if (pdfBytes == null || pdfBytes.length == 0) {
                throw new RuntimeException("Failed to download or empty PDF at: " + fileUrl);
            }

            try (PDDocument document = Loader.loadPDF(pdfBytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setStartPage(1);
                stripper.setEndPage(document.getNumberOfPages());
                return stripper.getText(document);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error extracting text from PDF: " + e.getMessage(), e);
        }
    }

    private boolean isS3Url(String fileUrl) {
        return fileUrl != null && fileUrl.contains(".amazonaws.com/");
    }

    private String extractS3Key(String fileUrl) {
        // Example: https://bucket.s3.region.amazonaws.com/uploads/file.pdf
        try {
            URI uri = new URI(fileUrl);
            String path = uri.getPath();
            if (path.startsWith("/")) {
                return path.substring(1);
            }
            return path;
        } catch (Exception e) {
            // Fallback: manually split if URI parsing fails
            if (fileUrl.contains(".amazonaws.com/")) {
                return fileUrl.substring(fileUrl.lastIndexOf(".amazonaws.com/") + 15);
            }
            return fileUrl;
        }
    }
}
