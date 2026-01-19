import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Download,
    Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

// Teacher View for Assignment Submissions
function TeacherSubmissionView() {
    const { classId, assignmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Assignment Details
                const assignmentRes = await axios.get(
                    `http://localhost:8080/api/assignments/details/${assignmentId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setAssignment(assignmentRes.data);

                // Fetch Class Students
                const classRes = await axios.get(
                    `http://localhost:8080/api/classes/${classId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Fetch Submissions for this assignment
                const submissionsRes = await axios.get(
                    `http://localhost:8080/api/submissions/assignment/${assignmentId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                console.log('Submissions data:', submissionsRes.data);   
                // Handle both array and single object responses
                const submissionsData = submissionsRes.data || [];
                const submissionsArray = Array.isArray(submissionsData) ? submissionsData : [submissionsData];
                setSubmissions(submissionsArray);
                
                // Also need student list to show who hasn't submitted.
                // let's fetch students of the class.
                const rawStudentIds = classRes.data.studentIds || [];
                const studentIds = [...new Set(rawStudentIds)]; // Deduplicate IDs
                console.log('Student IDs from class:', studentIds);
                
                const studentPromises = studentIds.map(id =>
                    axios.get(`http://localhost:8080/api/users/student/${id}`, { headers: { Authorization: `Bearer ${token}` } })
                        .catch(err => {
                            console.error(`Error fetching student ${id}:`, err.response?.status, err.response?.data);
                            return null;
                        })
                );

                const studentsResults = await Promise.allSettled(studentPromises);
                
                // Debug: log each result to see what's being returned
                console.log('Students fetch results:', studentsResults.map((result, idx) => ({
                    index: idx,
                    status: result.status,
                    hasData: result.status === 'fulfilled' && result.value?.data,
                    data: result.status === 'fulfilled' ? result.value.data : null,
                    error: result.status === 'rejected' ? result.reason.message : null
                })));

                const validStudents = studentsResults
                    .filter(result => {
                        if (result.status === 'fulfilled' && result.value?.data) {
                            const student = result.value.data;
                            // Check if it's a valid user object with id field
                            if (student && student.id) {
                                return true;
                            } else {
                                console.warn('Student data missing id field:', student);
                            }
                        }
                        if (result.status === 'rejected') {
                            console.error('Student fetch rejected:', result.reason?.message || result.reason);
                        }
                        return false;
                    })
                    .map(result => result.value.data);

                console.log('Valid students:', validStudents);
                console.log('Submissions studentIds:', (submissionsRes.data || []).map(s => s.studentId));
                
                setStudents(validStudents);

            } catch (err) {
                console.error('Error fetching data:', err);
                // Set empty arrays on error to prevent undefined issues
                if (err.response?.status === 404) {
                    setSubmissions([]);
                    setStudents([]);
                } else {
                    // For other errors, keep empty arrays
                    setSubmissions([]);
                    setStudents([]);
                }
            } finally {
                setLoading(false);
            }
        };

        if (token && assignmentId) {
            fetchData();
        }
    }, [classId, assignmentId, token]);

    const getStudentSubmission = (studentId) => {
        const submission = submissions.find(s => s.studentId === studentId);
        if (!submission && submissions.length > 0) {
            console.log(`No submission found for studentId: ${studentId}. Available submission studentIds:`, submissions.map(s => s.studentId));
        }
        return submission;
    };

    const handleDownload = (fileUrl, fileName) => {
        if (!fileUrl) {
            console.error('File URL is missing');
            alert('File URL is not available');
            return;
        }
        
        const fullUrl = `http://localhost:8080${fileUrl}`;
        console.log('Downloading file:', fullUrl, 'FileName:', fileName);
        
        // Try to download the file - if it fails, the backend will show an error
        // The user will see the error page if file doesn't exist
        const link = document.createElement('a');
        link.href = fullUrl;
        link.target = '_blank';
        link.download = fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredStudents = students.filter(student =>
        (student.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar classes={[]} userRole="TEACHER" />
                <main className="flex-1 ml-64 p-8 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar classes={[]} userRole="TEACHER" />
            <main className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/teacher/class/${classId}/assignments`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Assignments</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-gray-900">{assignment?.title}</h1>
                        <p className="text-gray-600 mt-1">Submissions</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                        <div className="text-sm text-gray-600">
                            {submissions.length} / {students.length} Submitted
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Submitted Date</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4">Attachments</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            No students found matching your search.
                                        </td>
                                    </tr>
                                ) : filteredStudents.map(student => {
                                    const submission = getStudentSubmission(student.id);
                                    const isLate = submission && assignment?.dueDate && submission.submissionDate 
                                        ? new Date(submission.submissionDate) > new Date(assignment.dueDate) 
                                        : false;

                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{student.username}</p>
                                                    <p className="text-gray-500 text-xs">{student.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {submission ? (
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isLate ? 'bg-amber-50 text-amber-700' : 'bg-success-50 text-success-700'
                                                        }`}>
                                                        {isLate ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                                        {isLate ? 'Late' : 'Submitted'}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                        <XCircle className="w-3 h-3" />
                                                        Missing
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {submission ? new Date(submission.submissionDate).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {submission ? (
                                                    <span className="font-medium text-gray-900">{submission.score || 0} <span className="text-gray-400 font-normal">/ {assignment?.points || 0}</span></span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {submission?.attachments?.length > 0 ? (
                                                    <div className="flex gap-2">
                                                        {submission.attachments.map((file, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleDownload(file.fileUrl, file.fileName)}
                                                                title={file.fileName || 'Download file'}
                                                                className="text-primary-600 hover:text-primary-800"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {/* Placeholder for grade action */}
                                                <button className="text-primary-600 hover:text-primary-700 font-medium text-xs">
                                                    Grade
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default TeacherSubmissionView;
