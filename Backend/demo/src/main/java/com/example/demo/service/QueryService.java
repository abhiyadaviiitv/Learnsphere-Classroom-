package com.example.demo.service;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.model.Query;
import com.example.demo.repository.QueryRepository;

import com.example.demo.repository.UserRepository;
import com.example.demo.model.User;

@Service
public class QueryService {

    @Autowired
    private QueryRepository queryRepository;

    @Autowired
    private UserRepository userRepository;

    public Query createQuery(Query query) {
        query.setCreatedAt(new Date());
        return queryRepository.save(query);
    }

    public List<Query> getQueriesByClassAndStudent(String classId, String studentId) {
        List<Query> queries = queryRepository.findByClassIdAndStudentId(classId, studentId);
        populateStudentNames(queries);
        return queries;
    }

    public List<Query> getQueriesByClass(String classId) {
        List<Query> queries = queryRepository.findByClassId(classId);
        populateStudentNames(queries);
        return queries;
    }

    public Query answerQuery(String queryId, String answer) {
        Query query = queryRepository.findById(queryId)
                .orElseThrow(() -> new RuntimeException("Query not found"));
        query.setAnswer(answer);
        query.setResolved(true);
        return queryRepository.save(query);
    }

    private void populateStudentNames(List<Query> queries) {
        queries.forEach(query -> {
            if (query.getStudentId() != null) {
                userRepository.findById(query.getStudentId()).ifPresent(user -> {
                    query.setStudentName(user.getUsername());
                });
            }
        });
    }
}
