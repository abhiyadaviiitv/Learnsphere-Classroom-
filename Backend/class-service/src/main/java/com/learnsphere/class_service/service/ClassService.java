package com.learnsphere.class_service.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.learnsphere.class_service.model.Class;
import com.learnsphere.class_service.repository.ClassRepository;

@Service
public class ClassService {

    @Autowired
    private ClassRepository classRepository;

    public List<Class> getAllClasses() {
        return classRepository.findAll();
    }

    public Optional<Class> getClassById(String id) {
        return classRepository.findById(id);
    }

    public Class createClass(Class newClass) {
        return classRepository.save(newClass);
    }

    public void deleteClass(String id) {
        classRepository.deleteById(id);
    }

    public boolean addStudentToClass(String classCode, String studentId) {
        Optional<Class> classOptional = classRepository.findBycode(classCode);
        if (classOptional.isPresent()) {
            Class classObj = classOptional.get();
            if (!classObj.getStudentIds().contains(studentId)) {
                classObj.getStudentIds().add(studentId);
                classRepository.save(classObj);
                return true;
            }
        }
        return false;
    }

    public List<Class> getClassesByTeacher(String teacherId) {
        return classRepository.findByTeacherId(teacherId);
    }

    public List<Class> getClassesByStudent(String studentId) {
        return classRepository.findByStudentIdsContaining(studentId);
    }

    public Class updateClass(Class classObj) {
        return classRepository.save(classObj);
    }
}



