import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    ArrowLeft,
    FileText,
    Calendar,
    CheckCircle,
    Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

function StudentAssignments() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');
    const studentId = localStorage.getItem('id');

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/assignments/${classId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Enhance assignments with submission status if possible
                // Ideally the backend returns this, but if not we might need to fetch submissions separately
                // For now displaying basic assignment info
                setAssignments(response.data || []);
            } catch (err) {
                console.error('Error fetching assignments:', err);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchAssignments();
        }
    }, [classId, token]);

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar classes={[]} userRole="STUDENT" />
                <main className="flex-1 ml-64 p-8 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar classes={[]} userRole="STUDENT" />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/class/${classId}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Class</span>
                    </button>

                    <div>
                        <h1 className="text-3xl font-display font-bold text-gray-900">All Assignments</h1>
                        <p className="text-gray-600 mt-1">View your tasks and submit work</p>
                    </div>
                </div>

                {/* Assignments List */}
                <div className="space-y-4">
                    {assignments.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FileText className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-gray-900 font-medium">No assignments yet</h3>
                        </div>
                    ) : (
                        assignments.map((assignment, index) => {
                            const isOverdue = new Date(assignment.dueDate) < new Date();

                            return (
                                <motion.div
                                    key={assignment.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="card p-6 hover:shadow-md transition-shadow cursor-pointer group"
                                    onClick={() => navigate(`/assignment/${assignment.id}`)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-error-50 text-error-600' : 'bg-primary-100 text-primary-600'
                                                }`}>
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {assignment.title}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className={isOverdue ? 'text-error-600 font-medium' : ''}>
                                                            Due {new Date(assignment.dueDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-medium">{assignment.pointsPossible} pts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                className="btn-primary text-sm flex items-center gap-2"
                                            >
                                                View Assignment
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}

export default StudentAssignments;
