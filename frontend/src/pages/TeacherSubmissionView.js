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
    Search,
    Sparkles,
    Loader2,
    X
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
    const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [isGrading, setIsGrading] = useState(false);
    const [gradingResult, setGradingResult] = useState(null);
    const [pdfGradingDialogOpen, setPdfGradingDialogOpen] = useState(false);
    const [selectedPdfSubmission, setSelectedPdfSubmission] = useState(null);
    const [referencePdfPath, setReferencePdfPath] = useState('');

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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-display font-bold text-gray-900">{assignment?.title}</h1>
                            <p className="text-gray-600 mt-1">Submissions</p>
                        </div>
                        <button
                            onClick={() => navigate(`/teacher/class/${classId}/assignments/${assignmentId}`)}
                            className="btn-ghost flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            View Assignment Details
                        </button>
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
                                                <div className="flex items-center justify-end gap-2">
                                                    {submission && submission.attachments?.some(a => a.fileName?.toLowerCase().endsWith('.pdf')) && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPdfSubmission(submission);
                                                                // Find reference PDF from assignment attachments
                                                                const refPdf = assignment?.attachments?.find(a => a.fileName?.toLowerCase().endsWith('.pdf'));
                                                                if (refPdf) {
                                                                    // Extract filename from fileUrl (e.g., /uploads/uuid.filename.pdf)
                                                                    const fileName = refPdf.fileUrl.split('/').pop();
                                                                    setReferencePdfPath(fileName);
                                                                }
                                                                setPdfGradingDialogOpen(true);
                                                            }}
                                                            className="text-primary-600 hover:text-primary-700 font-medium text-xs flex items-center gap-1"
                                                            title="AI Grade PDF with Context"
                                                        >
                                                            <Sparkles className="w-3 h-3" />
                                                            AI Grade PDF
                                                        </button>
                                                    )}
                                                    {submission && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSubmission(submission);
                                                                setGradingDialogOpen(true);
                                                            }}
                                                            className="text-primary-600 hover:text-primary-700 font-medium text-xs flex items-center gap-1"
                                                            title="AI Suggest Grade"
                                                        >
                                                            <Sparkles className="w-3 h-3" />
                                                            AI Grade
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* AI Grading Dialog */}
            {gradingDialogOpen && selectedSubmission && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-primary-600" />
                                    AI Grading Assistant
                                </h2>
                                <button
                                    onClick={() => {
                                        setGradingDialogOpen(false);
                                        setSelectedSubmission(null);
                                        setGradingResult(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {!gradingResult && !isGrading && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Question</h3>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                            {assignment?.questions?.[0]?.text || 'No question available'}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Student Answer</h3>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                                            {selectedSubmission.content || selectedSubmission.questionAnswers?.[Object.keys(selectedSubmission.questionAnswers || {})[0]] || 'No answer provided'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setIsGrading(true);
                                            try {
                                                const questionText = assignment?.questions?.[0]?.text || 'Evaluate this submission';
                                                const studentAnswer = selectedSubmission.content || selectedSubmission.questionAnswers?.[Object.keys(selectedSubmission.questionAnswers || {})[0]] || '';
                                                
                                                const response = await axios.post(
                                                    'http://localhost:8080/api/ai/grade',
                                                    {
                                                        question: questionText,
                                                        studentAnswer: studentAnswer,
                                                        maxPoints: assignment?.points || 100,
                                                        rubric: assignment?.instructions || ''
                                                    },
                                                    {
                                                        headers: {
                                                            'Authorization': `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                                        }
                                                    }
                                                );
                                                setGradingResult(response.data);
                                            } catch (err) {
                                                console.error('Error grading submission:', err);
                                                alert('Failed to grade submission. Please try again.');
                                            } finally {
                                                setIsGrading(false);
                                            }
                                        }}
                                        className="btn-primary w-full flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Get AI Grade Suggestion
                                    </button>
                                </div>
                            )}
                            {isGrading && (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-600">AI is analyzing the submission...</p>
                                </div>
                            )}
                            {gradingResult && (
                                <div className="space-y-4">
                                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Suggested Score</span>
                                            <span className="text-2xl font-bold text-primary-600">
                                                {gradingResult.suggestedScore} / {assignment?.points || 100}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Feedback</h3>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                                            {gradingResult.feedback}
                                        </p>
                                    </div>
                                    {gradingResult.feedbackItems && gradingResult.feedbackItems.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">Feedback Items</h3>
                                            <ul className="space-y-2">
                                                {gradingResult.feedbackItems.map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                                                        <CheckCircle className="w-4 h-4 text-success-500 mt-1 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {gradingResult.reasoning && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">Reasoning</h3>
                                            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                                                {gradingResult.reasoning}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => {
                                                setGradingDialogOpen(false);
                                                setSelectedSubmission(null);
                                                setGradingResult(null);
                                            }}
                                            className="btn-ghost flex-1"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={async () => {
                                                // Update submission with AI suggested score
                                                try {
                                                    await axios.put(
                                                        `http://localhost:8080/api/submissions/assignments/${assignmentId}/submissions/${selectedSubmission.id}`,
                                                        {
                                                            ...selectedSubmission,
                                                            score: gradingResult.suggestedScore
                                                        },
                                                        {
                                                            headers: {
                                                                'Authorization': `Bearer ${token}`,
                                                                'Content-Type': 'application/json'
                                                            }
                                                        }
                                                    );
                                                    alert('Score updated successfully!');
                                                    setGradingDialogOpen(false);
                                                    window.location.reload();
                                                } catch (err) {
                                                    console.error('Error updating score:', err);
                                                    alert('Failed to update score. Please try again.');
                                                }
                                            }}
                                            className="btn-primary flex-1"
                                        >
                                            Apply Score
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Grading with Context Dialog */}
            {pdfGradingDialogOpen && selectedPdfSubmission && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-primary-600" />
                                    AI PDF Grading with Context
                                </h2>
                                <button
                                    onClick={() => {
                                        setPdfGradingDialogOpen(false);
                                        setSelectedPdfSubmission(null);
                                        setReferencePdfPath('');
                                        setGradingResult(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {!gradingResult && !isGrading && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Reference Material (Context)</h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {referencePdfPath ? `Using: ${referencePdfPath}` : 'No reference PDF found in assignment. Please upload one.'}
                                        </p>
                                        {!referencePdfPath && (
                                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                                Note: Upload a reference PDF in the assignment to use as context for grading.
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Student Submission PDF</h3>
                                        <p className="text-sm text-gray-600">
                                            {selectedPdfSubmission.attachments?.find(a => a.fileName?.toLowerCase().endsWith('.pdf'))?.fileName || 'No PDF found'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!referencePdfPath) {
                                                alert('No reference PDF found. Please upload a reference PDF in the assignment.');
                                                return;
                                            }
                                            setIsGrading(true);
                                            try {
                                                const studentPdf = selectedPdfSubmission.attachments?.find(a => a.fileName?.toLowerCase().endsWith('.pdf'));
                                                if (!studentPdf) {
                                                    throw new Error('No PDF found in submission');
                                                }
                                                
                                                // Extract filename from fileUrl
                                                const studentPdfPath = studentPdf.fileUrl.split('/').pop();
                                                
                                                const response = await axios.post(
                                                    'http://localhost:8080/api/ai/grade-pdf',
                                                    {
                                                        referenceMaterialPath: referencePdfPath,
                                                        studentSubmissionPath: studentPdfPath,
                                                        maxPoints: assignment?.points || 100,
                                                        rubric: assignment?.instructions || ''
                                                    },
                                                    {
                                                        headers: {
                                                            'Authorization': `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                                        }
                                                    }
                                                );
                                                setGradingResult(response.data);
                                            } catch (err) {
                                                console.error('Error grading PDF:', err);
                                                alert('Failed to grade PDF. Please try again.');
                                            } finally {
                                                setIsGrading(false);
                                            }
                                        }}
                                        className="btn-primary w-full flex items-center justify-center gap-2"
                                        disabled={!referencePdfPath}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Grade PDF with AI
                                    </button>
                                </div>
                            )}
                            {isGrading && (
                                <div className="text-center py-8">
                                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-600">AI is analyzing the PDFs...</p>
                                    <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
                                </div>
                            )}
                            {gradingResult && (
                                <div className="space-y-4">
                                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">Suggested Score</span>
                                            <span className="text-2xl font-bold text-primary-600">
                                                {gradingResult.suggestedScore} / {assignment?.points || 100}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Feedback</h3>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                                            {gradingResult.feedback}
                                        </p>
                                    </div>
                                    {gradingResult.feedbackItems && gradingResult.feedbackItems.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">Feedback Items</h3>
                                            <ul className="space-y-2">
                                                {gradingResult.feedbackItems.map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                                                        <CheckCircle className="w-4 h-4 text-success-500 mt-1 flex-shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => {
                                                setPdfGradingDialogOpen(false);
                                                setSelectedPdfSubmission(null);
                                                setReferencePdfPath('');
                                                setGradingResult(null);
                                            }}
                                            className="btn-ghost flex-1"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await axios.put(
                                                        `http://localhost:8080/api/submissions/assignments/${assignmentId}/submissions/${selectedPdfSubmission.id}`,
                                                        {
                                                            ...selectedPdfSubmission,
                                                            score: gradingResult.suggestedScore
                                                        },
                                                        {
                                                            headers: {
                                                                'Authorization': `Bearer ${token}`,
                                                                'Content-Type': 'application/json'
                                                            }
                                                        }
                                                    );
                                                    alert('Score updated successfully!');
                                                    setPdfGradingDialogOpen(false);
                                                    window.location.reload();
                                                } catch (err) {
                                                    console.error('Error updating score:', err);
                                                    alert('Failed to update score. Please try again.');
                                                }
                                            }}
                                            className="btn-primary flex-1"
                                        >
                                            Apply Score
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherSubmissionView;
