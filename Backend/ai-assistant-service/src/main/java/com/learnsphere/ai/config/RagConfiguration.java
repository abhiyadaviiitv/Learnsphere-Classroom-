package com.learnsphere.ai.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.google.genai.GoogleGenAiEmbeddingConnectionDetails;
import org.springframework.ai.google.genai.text.GoogleGenAiTextEmbeddingModel;
import org.springframework.ai.google.genai.text.GoogleGenAiTextEmbeddingOptions;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.support.RetryTemplate;
import io.micrometer.observation.ObservationRegistry;

@Configuration
public class RagConfiguration {

    @Value("${spring.ai.google.genai.api-key}")
    private String apiKey;

    @Bean
    public GoogleGenAiEmbeddingConnectionDetails googleGenAiEmbeddingConnectionDetails() {
        return GoogleGenAiEmbeddingConnectionDetails.builder()
                .apiKey(apiKey)
                .build();
    }

    @Bean
    public EmbeddingModel embeddingModel(GoogleGenAiEmbeddingConnectionDetails connectionDetails) {
        return new GoogleGenAiTextEmbeddingModel(connectionDetails,
                GoogleGenAiTextEmbeddingOptions.builder().build(),
                new RetryTemplate(),
                ObservationRegistry.NOOP);
    }

    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel) {
        return SimpleVectorStore.builder(embeddingModel).build();
    }
}
