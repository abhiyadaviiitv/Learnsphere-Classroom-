package com.learnsphere.analytics.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.learnsphere.analytics.client.UserServiceClient;
import com.learnsphere.analytics.model.Assignment;
import com.learnsphere.analytics.model.Submission;
import com.learnsphere.analytics.repository.AssignmentRepository;
import com.learnsphere.analytics.repository.ClassRepository;
import com.learnsphere.analytics.repository.SubmissionRepository;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private ClassRepository classRepository;

    @Autowired
    private UserServiceClient userServiceClient;

    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getClassAnalytics(@PathVariable String classId) {
        List<Assignment> assignments = assignmentRepository.findByclassId(classId).orElse(new ArrayList<>());

        com.learnsphere.analytics.model.Class cls = classRepository.findById(classId).orElse(null);
        int totalStudents = (cls != null && cls.getStudentIds() != null) ? cls.getStudentIds().size() : 0;

        if (assignments.isEmpty()) {
            Map<String, Object> emptyAnalytics = new HashMap<>();
            emptyAnalytics.put("averageGrade", 0);
            emptyAnalytics.put("submissionRate", 0);
            emptyAnalytics.put("atRiskStudents", 0);
            emptyAnalytics.put("gradeDistribution", new int[5]);
            emptyAnalytics.put("studentPerformance", new HashMap<>());
            return ResponseEntity.ok(emptyAnalytics);
        }

        Map<String, List<Double>> studentScores = new HashMap<>();
        int totalSubmissions = 0;

        for (Assignment assignment : assignments) {
            List<Submission> submissions = submissionRepository.findByAssignmentId(assignment.getId());
            totalSubmissions += submissions.size();

            for (Submission submission : submissions) {
                if (assignment.getPoints() > 0) {
                    double percentage = ((double) submission.getScore() / assignment.getPoints()) * 100;
                    studentScores.computeIfAbsent(submission.getStudentId(), k -> new ArrayList<>()).add(percentage);
                }
            }
        }

        int[] distribution = new int[5];
        Map<String, List<Map<String, Object>>> studentPerformance = new HashMap<>();
        studentPerformance.put("A", new ArrayList<>());
        studentPerformance.put("B", new ArrayList<>());
        studentPerformance.put("C", new ArrayList<>());
        studentPerformance.put("D", new ArrayList<>());
        studentPerformance.put("F", new ArrayList<>());

        int atRiskCount = 0;
        double totalStudentAverages = 0;
        int studentsWithGrades = 0;

        for (Map.Entry<String, List<Double>> entry : studentScores.entrySet()) {
            String studentId = entry.getKey();
            List<Double> scores = entry.getValue();

            double avg = scores.stream().mapToDouble(d -> d).average().orElse(0.0);
            totalStudentAverages += avg;
            studentsWithGrades++;

            String gradeLetter;
            if (avg >= 90)
                gradeLetter = "A";
            else if (avg >= 80)
                gradeLetter = "B";
            else if (avg >= 70)
                gradeLetter = "C";
            else if (avg >= 50)
                gradeLetter = "D";
            else
                gradeLetter = "F";

            switch (gradeLetter) {
                case "A":
                    distribution[4]++;
                    break;
                case "B":
                    distribution[3]++;
                    break;
                case "C":
                    distribution[2]++;
                    break;
                case "D":
                    distribution[1]++;
                    break;
                case "F":
                    distribution[0]++;
                    break;
            }

            if (avg < 50.0) {
                atRiskCount++;
            }

            // Call User Service to get student name (Service-to-Service Communication)
            String studentName = "Unknown Student";
            try {
                Map<String, Object> user = userServiceClient.getUserById(studentId);
                if (user != null && user.containsKey("username")) {
                    studentName = (String) user.get("username");
                }
            } catch (Exception e) {
                System.err.println("Error fetching user from User Service: " + e.getMessage());
            }

            Map<String, Object> studentData = new HashMap<>();
            studentData.put("id", studentId);
            studentData.put("name", studentName);
            studentData.put("average", Math.round(avg * 10) / 10.0);

            studentPerformance.get(gradeLetter).add(studentData);
        }

        double classAverage = studentsWithGrades > 0 ? (totalStudentAverages / studentsWithGrades) : 0;

        double submissionRate = 0;
        if (totalStudents > 0 && !assignments.isEmpty()) {
            double totalPossibleSubmissions = assignments.size() * totalStudents;
            submissionRate = (totalSubmissions / totalPossibleSubmissions) * 100;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("averageGrade", Math.round(classAverage * 10) / 10.0);
        response.put("submissionRate", Math.round(submissionRate * 10) / 10.0);
        response.put("atRiskStudents", atRiskCount);
        response.put("gradeDistribution", distribution);
        response.put("studentPerformance", studentPerformance);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/class/{classId}/student/{studentId}")
    public ResponseEntity<?> getStudentAnalytics(@PathVariable String classId, @PathVariable String studentId) {
        List<Assignment> assignments = assignmentRepository.findByclassId(classId).orElse(new ArrayList<>());

        if (assignments.isEmpty()) {
            return ResponseEntity.ok(Map.of("studentAverage", 0, "classAverage", 0, "completionRate", 0,
                    "assignmentComparisons", new ArrayList<>()));
        }

        double studentTotalPercentage = 0;
        int studentSubmissionCount = 0;

        List<Map<String, Object>> assignmentComparisons = new ArrayList<>();

        for (Assignment assignment : assignments) {
            List<Submission> submissions = submissionRepository.findByAssignmentId(assignment.getId());

            double classTotal = 0;
            int count = 0;
            for (Submission s : submissions) {
                if (assignment.getPoints() > 0) {
                    classTotal += ((double) s.getScore() / assignment.getPoints()) * 100;
                    count++;
                }
            }
            double assignmentClassAvg = count > 0 ? classTotal / count : 0;

            Submission studentSub = submissions.stream()
                    .filter(s -> s.getStudentId().equals(studentId))
                    .findFirst().orElse(null);

            double studentScoreFn = 0;
            if (studentSub != null && assignment.getPoints() > 0) {
                studentScoreFn = ((double) studentSub.getScore() / assignment.getPoints()) * 100;
                studentTotalPercentage += studentScoreFn;
                studentSubmissionCount++;
            }

            Map<String, Object> comp = new HashMap<>();
            comp.put("assignmentTitle", assignment.getTitle());
            comp.put("classAverage", Math.round(assignmentClassAvg * 10) / 10.0);
            comp.put("studentScore", (studentSub != null) ? Math.round(studentScoreFn * 10) / 10.0 : 0);
            comp.put("isSubmitted", studentSub != null);
            assignmentComparisons.add(comp);
        }

        double studentAverage = studentSubmissionCount > 0 ? (studentTotalPercentage / studentSubmissionCount) : 0;
        double overallClassAvg = assignmentComparisons.stream()
                .mapToDouble(m -> (Double) m.get("classAverage"))
                .average().orElse(0.0);

        double completionRate = (double) studentSubmissionCount / assignments.size() * 100;

        Map<String, Object> response = new HashMap<>();
        response.put("studentAverage", Math.round(studentAverage * 10) / 10.0);
        response.put("classAverage", Math.round(overallClassAvg * 10) / 10.0);
        response.put("completionRate", Math.round(completionRate * 10) / 10.0);
        response.put("assignmentComparisons", assignmentComparisons);

        return ResponseEntity.ok(response);
    }
}

