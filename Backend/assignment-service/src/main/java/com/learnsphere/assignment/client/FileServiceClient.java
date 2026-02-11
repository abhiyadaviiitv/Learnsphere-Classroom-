package com.learnsphere.assignment.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import com.learnsphere.assignment.dto.Attachment;

@FeignClient(name = "file-service")
public interface FileServiceClient {

    @PostMapping(value = "/api/files/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    List<Attachment> uploadFiles(@RequestPart("files") List<MultipartFile> files);

}
