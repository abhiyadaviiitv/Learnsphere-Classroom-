package com.learnsphere.ai.service;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatModel chatModel;
    private final VectorStore vectorStore;
    private final PdfProcessingService pdfProcessingService;

    @Autowired
    public ChatService(ChatModel chatModel, VectorStore vectorStore, PdfProcessingService pdfProcessingService) {
        this.chatModel = chatModel;
        this.vectorStore = vectorStore;
        this.pdfProcessingService = pdfProcessingService;
    }

    public String chat(String query, List<String> allowedClassIds) {
        // 1. Retrieve relevant documents from Vector Store
        // 0.8.1 similiaritySearch usually takes just query string or topK
        List<Document> similarDocuments = vectorStore.similaritySearch(query);

        // 2. Filter (In-Memory for now as 0.8.1 SimpleVectorStore might not support
        // complex filters)
        // If we need strict filtering, we filter the results.
        // Note: This is less efficient than pre-filtering but works for
        // SimpleVectorStore
        if (allowedClassIds != null && !allowedClassIds.isEmpty()) {
            similarDocuments = similarDocuments.stream()
                    .filter(doc -> {
                        if (doc.getMetadata() == null)
                            return false;
                        String classId = (String) doc.getMetadata().get("classId");
                        return allowedClassIds.contains(classId);
                    })
                    .collect(Collectors.toList());
        }

        // 3. Construct Context
        String context = similarDocuments.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n\n"));

        // 4. Prompt Engineering (RAG)
        String promptText = """
                You are a helpful teaching assistant for the LearnSphere platform.
                Use the following context to answer the student's question.
                If the answer is not in the context, say "I don't have enough information to answer that based on the class materials."

                Context:
                {context}

                Question:
                {question}
                """;

        PromptTemplate template = new PromptTemplate(promptText);
        Prompt prompt = template.create(Map.of("context", context, "question", query));

        // 5. Call AI
        return chatModel.call(prompt).getResult().getOutput().getText();
    }

    public void ingestDocument(com.learnsphere.ai.dto.DataIngestionRequest request) {
        StringBuilder combinedContent = new StringBuilder();

        // Add plain text content
        if (request.getTextContent() != null && !request.getTextContent().trim().isEmpty()) {
            combinedContent.append(request.getTextContent()).append("\n\n");
        }

        // Add PDF content
        if (request.getPdfUrls() != null && !request.getPdfUrls().isEmpty()) {
            for (String pdfUrl : request.getPdfUrls()) {
                try {
                    String extractedText = pdfProcessingService.extractTextFromPdf(pdfUrl);
                    if (extractedText != null && !extractedText.trim().isEmpty()) {
                        combinedContent.append("Content from attached document:\n");
                        combinedContent.append(extractedText).append("\n\n");
                    }
                } catch (Exception e) {
                    System.err.println("Failed to extract text from PDF during ingestion: " + pdfUrl + " error: "
                            + e.getMessage());
                }
            }
        }

        if (combinedContent.length() > 0) {
            Document document = new Document(combinedContent.toString(), Map.of("classId", request.getClassId()));
            vectorStore.add(List.of(document));
        }
    }
}
