package com.learnsphere.class_service.service;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.learnsphere.class_service.model.Query;
import com.learnsphere.class_service.repository.QueryRepository;

@Service
public class QueryService {

    @Autowired
    private QueryRepository queryRepository;

    public Query createQuery(Query query) {
        query.setCreatedAt(new Date());
        return queryRepository.save(query);
    }

    public List<Query> getQueriesByClassAndStudent(String classId, String studentId) {
        return queryRepository.findByClassIdAndStudentId(classId, studentId);
    }

    public List<Query> getQueriesByClass(String classId) {
        return queryRepository.findByClassId(classId);
    }

    public Query answerQuery(String queryId, String answer) {
        Query query = queryRepository.findById(queryId)
                .orElseThrow(() -> new RuntimeException("Query not found"));
        query.setAnswer(answer);
        query.setResolved(true);
        return queryRepository.save(query);
    }
}


