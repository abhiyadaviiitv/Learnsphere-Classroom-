package com.learnsphere.class_service.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learnsphere.class_service.model.QuickLink;
import com.learnsphere.class_service.service.QuickLinkService;

@RestController
@RequestMapping("/api/quicklinks")
public class QuickLinkController {

    @Autowired
    private QuickLinkService quickLinkService;

    @PostMapping
    public ResponseEntity<QuickLink> createQuickLink(@RequestBody QuickLink quickLink) {
        return ResponseEntity.ok(quickLinkService.createQuickLink(quickLink));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<QuickLink>> getClassQuickLinks(@PathVariable String classId) {
        return ResponseEntity.ok(quickLinkService.getQuickLinksByClass(classId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuickLink(@PathVariable String id) {
        quickLinkService.deleteQuickLink(id);
        return ResponseEntity.ok().build();
    }
}


