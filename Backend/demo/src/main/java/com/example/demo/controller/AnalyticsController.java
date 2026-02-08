package com.example.demo.controller;

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

import com.example.demo.model.Assignment;
import com.example.demo.model.Submission;
import com.example.demo.repository.AssignmentRepository;
import com.example.demo.repository.SubmissionRepository;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private com.example.demo.repository.ClassRepository classRepository;

    @Autowired
    private com.example.demo.repository.UserRepository userRepository;

    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getClassAnalytics(@PathVariable String classId) {
        // Fetch all assignments for the class
        List<Assignment> assignments = assignmentRepository.findByclassId(classId).orElse(new ArrayList<>());

        // Fetch class to get student count
        com.example.demo.model.Class cls = classRepository.findById(classId).orElse(null);
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

        // Student scores map: StudentID -> List of percentages
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

        // Prepare Response Data
        int[] distribution = new int[5]; // F, D, C, B, A
        Map<String, List<Map<String, Object>>> studentPerformance = new HashMap<>();
        studentPerformance.put("A", new ArrayList<>());
        studentPerformance.put("B", new ArrayList<>());
        studentPerformance.put("C", new ArrayList<>());
        studentPerformance.put("D", new ArrayList<>());
        studentPerformance.put("F", new ArrayList<>());

        int atRiskCount = 0;
        double totalStudentAverages = 0;
        int studentsWithGrades = 0;

        // Iterate over all enrolled students to ensure even those without submissions
        // are counted (as 0 optionally, or just skipped)
        // For accurate analytics, we'll iterate over studentScores (students who have
        // submitted at least something)
        // OR iterate over all studentIds in the class if we want to include 0s.
        // Let's stick to students who have activity for now to avoid skewing with pure
        // 0s if they just joined.

        // BETTER APPROACH: Iterate over the studentScores map we built
        for (Map.Entry<String, List<Double>> entry : studentScores.entrySet()) {
            String studentId = entry.getKey();
            List<Double> scores = entry.getValue();

            // Average of all assignments for this student
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
                gradeLetter = "D"; // CREATED: D is now 50-69
            else
                gradeLetter = "F";

            // Populate Distribution
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

            if (avg < 50.0) { // At risk is failing (F)
                atRiskCount++;
            }

            // Fetch Name
            com.example.demo.model.User student = userRepository.findById(studentId).orElse(null);
            String studentName = (student != null) ? student.getUsername() : "Unknown Student";

            Map<String, Object> studentData = new HashMap<>();
            studentData.put("id", studentId);
            studentData.put("name", studentName);
            studentData.put("average", Math.round(avg * 10) / 10.0);

            studentPerformance.get(gradeLetter).add(studentData);
        }

        double classAverage = studentsWithGrades > 0 ? (totalStudentAverages / studentsWithGrades) : 0;

        // Calculate Submission Rate: Total Submissions / (Assignments * Students)
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
            System.out.println(
                    "Analytics Debug - Assignment: " + assignment.getId() + " (" + assignment.getTitle() + ")");
            System.out.println("Analytics Debug - Submissions found: " + submissions.size());
            System.out.println("Analytics Debug - Looking for StudentID: " + studentId);

            for (Submission s : submissions) {
                System.out.println("  - Sub StudentID: " + s.getStudentId());
            }

            // Calculate Class Average for this assignment
            double classTotal = 0;
            int count = 0;
            for (Submission s : submissions) {
                if (assignment.getPoints() > 0) {
                    classTotal += ((double) s.getScore() / assignment.getPoints()) * 100;
                    count++;
                }
            }
            double assignmentClassAvg = count > 0 ? classTotal / count : 0;

            // Find Student Submission
            Submission studentSub = submissions.stream()
                    .filter(s -> s.getStudentId().equals(studentId))
                    .findFirst().orElse(null);

            double studentScoreFn = 0;
            if (studentSub != null && assignment.getPoints() > 0) {
                studentScoreFn = ((double) studentSub.getScore() / assignment.getPoints()) * 100;
                studentTotalPercentage += studentScoreFn;
                studentSubmissionCount++;
            }

            // Add to Comparison List
            Map<String, Object> comp = new HashMap<>();
            comp.put("assignmentTitle", assignment.getTitle());
            comp.put("classAverage", Math.round(assignmentClassAvg * 10) / 10.0);
            comp.put("studentScore", (studentSub != null) ? Math.round(studentScoreFn * 10) / 10.0 : 0);
            comp.put("isSubmitted", studentSub != null);
            assignmentComparisons.add(comp);
        }

        double studentAverage = studentSubmissionCount > 0 ? (studentTotalPercentage / studentSubmissionCount) : 0;
        // Overall class average calculation could be complex, sticking to simple
        // aggregation or re-using previous logic
        // For simplicity, let's average the assignmentClassAvgs
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
