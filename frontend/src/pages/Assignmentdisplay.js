import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft,
    FileText,
    Calendar,
    Download,
    Upload,
    X,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

function AssignmentDisplay() {
    const { assignmentid } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assignment, setAssignment] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [questionAnswers, setQuestionAnswers] = useState({});
    const [submissionText, setSubmissionText] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'work'

    const token = localStorage.getItem('token');
    const studentId = localStorage.getItem('id');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Assignment
                const assignmentRes = await axios.get(
                    `http://localhost:8080/api/assignments/details/${assignmentid}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setAssignment(assignmentRes.data);

                // Initialize answers
                const initialAnswers = {};
                assignmentRes.data.questions?.forEach((q, i) => {
                    initialAnswers[`q${i}`] = '';
                });
                setQuestionAnswers(initialAnswers);

                // Fetch Submission
                const submissionRes = await axios.get(
                    `http://localhost:8080/api/submissions/${assignmentid}/${studentId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (submissionRes.data) {
                    setSubmission(submissionRes.data);
                    setSubmissionText(submissionRes.data.content || '');
                    setQuestionAnswers(submissionRes.data.questionAnswers || initialAnswers);
                    // Default to 'work' tab if already submitted
                    setActiveTab('work');
                } else {
                    setSubmission(null);
                    setSubmissionText('');
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                if (err.response && err.response.status !== 404) {
                    setError('Failed to load assignment data.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (token && assignmentid) {
            fetchData();
        }
    }, [assignmentid, token, studentId]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const calculateScore = () => {
        if (!assignment || !assignment.questions) return { score: 0, maxScore: 0 };

        let totalScore = 0;
        let maxPossibleScore = 0;

        assignment.questions.forEach((question, index) => {
            if (!question) return;

            maxPossibleScore += question.points || 0;
            const answerKey = `q${index}`;
            const studentAnswer = (questionAnswers[answerKey] || '').toString().trim();
            const expectedAnswer = (question.expectedAnswer || '').toString().trim();

            if (studentAnswer && expectedAnswer) {
                if (studentAnswer.toLowerCase().includes(expectedAnswer.toLowerCase())) {
                    totalScore += question.points || 0;
                }
            }
        });

        // Late penalty calculation could be added here similar to previous implementation

        return { score: totalScore, maxScore: maxPossibleScore };
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const scoreInfo = calculateScore();

            const formattedAnswers = {};
            assignment.questions.forEach((_, index) => {
                formattedAnswers[`q${index}`] = questionAnswers[`q${index}`] || '';
            });

            const submissionDto = {
                studentId: studentId,
                content: submissionText,
                score: scoreInfo.score,
                submissionDate: new Date().toISOString(),
                questionAnswers: formattedAnswers
            };

            const formData = new FormData();
            formData.append('formData', new Blob([JSON.stringify(submissionDto)], { type: 'application/json' }));

            selectedFiles.forEach(file => {
                formData.append('attachments', file);
            });

            const url = submission
                ? `http://localhost:8080/api/submissions/assignments/${assignmentid}/submissions/${submission.id}`
                : `http://localhost:8080/api/submissions/assignments/${assignmentid}/submissions`;

            const method = submission ? 'put' : 'post';

            const response = await axios[method](url, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSubmission(response.data);
            setIsEditing(false);
            setSelectedFiles([]);
            alert('Assignment submitted successfully!');
            setActiveTab('work');
        } catch (err) {
            console.error('Submission failed:', err);
            alert('Failed to submit assignment.');
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const s = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
    };

    const downloadFile = (fileUrl, fileName) => {
        const fullUrl = `http://localhost:8080${fileUrl}`;
        window.open(fullUrl, '_blank');
    };


    if (loading && !assignment) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar classes={[]} userRole="STUDENT" />
                <main className="flex-1 ml-64 p-8 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </main>
            </div>
        );
    }

    if (!assignment) return <div>Assignment not found</div>;

    const isPastDue = new Date(assignment.dueDate) < new Date();

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar classes={[]} userRole="STUDENT" />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-display font-bold text-gray-900">{assignment.title}</h1>
                        {submission && (
                            <div className="px-4 py-2 bg-success-50 text-success-700 rounded-full text-sm font-medium flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Submitted
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className={isPastDue ? 'text-error-600 font-medium' : ''}>
                                Due {new Date(assignment.dueDate).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{assignment.points || 0} Points</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'details'
                                    ? 'text-primary-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Assignment Details
                            {activeTab === 'details' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('work')}
                            className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'work'
                                    ? 'text-primary-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            My Work & Score
                            {activeTab === 'work' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl">
                    {activeTab === 'details' ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Description */}
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Instructions</h2>
                                <div className="prose prose-sm max-w-none text-gray-600">
                                    {assignment.description || 'No instructions provided.'}
                                </div>
                            </div>

                            {/* Attachments */}
                            {assignment.attachments && assignment.attachments.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Reference Materials</h2>
                                    <div className="grid gap-3">
                                        {assignment.attachments.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-primary-600">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{file.fileName}</p>
                                                        <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => downloadFile(file.fileUrl, file.fileName)}
                                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* Score Card (if graded or submitted) */}
                            {submission && (
                                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 bg-gradient-to-r from-primary-50 to-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">Your Grade</h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Submitted on {new Date(submission.submissionDate).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-primary-600">
                                                {submission.score || 0}
                                                <span className="text-lg text-gray-400 font-normal">/{assignment.points}</span>
                                            </div>
                                            {isPastDue && (
                                                <p className="text-xs text-error-600 font-medium mt-1">Past Due</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Work Area */}
                            {(!submission || isEditing) ? (
                                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                    <h2 className="text-lg font-bold text-gray-900 mb-6">Your Response</h2>

                                    {/* Questions */}
                                    {assignment.questions && assignment.questions.map((q, i) => (
                                        <div key={i} className="mb-6">
                                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                                {i + 1}. {q.text} <span className="text-gray-500 font-normal">({q.points} pts)</span>
                                            </label>
                                            <textarea
                                                value={questionAnswers[`q${i}`] || ''}
                                                onChange={(e) => setQuestionAnswers(prev => ({ ...prev, [`q${i}`]: e.target.value }))}
                                                className="input-field w-full h-24"
                                                placeholder="Type your answer..."
                                            />
                                        </div>
                                    ))}

                                    {/* Additional Comments */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-900 mb-2">Additional Comments</label>
                                        <textarea
                                            value={submissionText}
                                            onChange={(e) => setSubmissionText(e.target.value)}
                                            className="input-field w-full h-32"
                                            placeholder="Add any additional context..."
                                        />
                                    </div>

                                    {/* File Upload */}
                                    <div className="mb-8">
                                        <label className="block text-sm font-medium text-gray-900 mb-2">Attachments</label>
                                        <div className="flex items-center gap-4">
                                            <label className="btn-secondary cursor-pointer flex items-center gap-2">
                                                <Upload className="w-4 h-4" />
                                                Add Files
                                                <input type="file" multiple onChange={handleFileChange} className="hidden" />
                                            </label>
                                            <span className="text-sm text-gray-500">
                                                {selectedFiles.length} file(s) selected
                                            </span>
                                        </div>

                                        {selectedFiles.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {selectedFiles.map((file, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                                                        <button onClick={() => removeFile(i)} className="text-error-500 hover:text-error-700">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
                                        {isEditing && (
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="btn-ghost"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSubmit}
                                            className="btn-primary px-8"
                                            disabled={loading}
                                        >
                                            {loading ? 'Submitting...' : 'Turn In'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Submitted Work</h2>

                                    {/* Read-only Answers */}
                                    {assignment.questions && assignment.questions.map((q, i) => (
                                        <div key={i} className="mb-6 pb-4 border-b border-gray-100 last:border-0">
                                            <p className="text-sm font-medium text-gray-900 mb-2">
                                                {i + 1}. {q.text}
                                            </p>
                                            <div className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm">
                                                {questionAnswers[`q${i}`] || 'No answer provided'}
                                            </div>
                                        </div>
                                    ))}

                                    {submissionText && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-medium text-gray-900 mb-2">Comments</h3>
                                            <p className="text-gray-600 text-sm whitespace-pre-wrap">{submissionText}</p>
                                        </div>
                                    )}

                                    {submission.attachments && submission.attachments.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900 mb-3">Attached Files</h3>
                                            <div className="grid gap-2">
                                                {submission.attachments.map((file, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                                                        <span className="text-sm truncate">{file.fileName}</span>
                                                        <button
                                                            onClick={() => downloadFile(file.fileUrl, file.fileName)}
                                                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                                        >
                                                            Download
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!isPastDue && (
                                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="btn-secondary"
                                            >
                                                Unsubmit & Edit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AssignmentDisplay;