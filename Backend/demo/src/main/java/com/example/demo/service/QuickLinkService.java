package com.example.demo.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.model.QuickLink;
import com.example.demo.repository.QuickLinkRepository;

@Service
public class QuickLinkService {

    @Autowired
    private QuickLinkRepository quickLinkRepository;

    public QuickLink createQuickLink(QuickLink quickLink) {
        return quickLinkRepository.save(quickLink);
    }

    public List<QuickLink> getQuickLinksByClass(String classId) {
        return quickLinkRepository.findByClassId(classId);
    }

    public void deleteQuickLink(String id) {
        quickLinkRepository.deleteById(id);
    }
}
