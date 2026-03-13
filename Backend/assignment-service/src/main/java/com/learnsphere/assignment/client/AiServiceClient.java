package com.learnsphere.assignment.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.learnsphere.assignment.dto.DataIngestionRequest;

@FeignClient(name = "ai-assistant-service")
public interface AiServiceClient {

    @PostMapping("/api/ai/ingest")
    ResponseEntity<String> ingestData(@RequestBody DataIngestionRequest request);

}
