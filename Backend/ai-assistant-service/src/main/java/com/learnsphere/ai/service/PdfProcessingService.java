package com.learnsphere.ai.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class PdfProcessingService {
    
    private final String uploadDir;
    
    public PdfProcessingService(@Value("${file.upload-dir:../uploads}") String uploadDir) {
        this.uploadDir = uploadDir;
    }
    
    /**
     * Extract text from a PDF file stored in the uploads folder
     * @param filePath Relative path from uploads folder (e.g., "uuid.filename.pdf")
     * @return Extracted text from PDF
     */
    public String extractTextFromPdf(String filePath) {
        PDDocument document = null;
        try {
            // Resolve the full path
            Path fullPath = Paths.get(uploadDir, filePath);
            File pdfFile = fullPath.toFile();
            
            if (!pdfFile.exists()) {
                throw new RuntimeException("PDF file not found: " + fullPath.toString());
            }
            
            // Load PDF document
            document = PDDocument.load(pdfFile);
            
            // Extract text using PDFTextStripper
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(document.getNumberOfPages());
            
            String text = stripper.getText(document);
            
            return text;
                    
        } catch (IOException e) {
            throw new RuntimeException("Error extracting text from PDF: " + e.getMessage(), e);
        } finally {
            if (document != null) {
                try {
                    document.close();
                } catch (IOException e) {
                    // Log error but don't throw
                    System.err.println("Error closing PDF document: " + e.getMessage());
                }
            }
        }
    }
}

