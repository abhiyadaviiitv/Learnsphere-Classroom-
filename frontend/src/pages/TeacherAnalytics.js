import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    ArrowLeft,
    Users,
    Award,
    TrendingUp,
    AlertTriangle,
    BarChart2,
    PieChart,
    Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

function TeacherAnalytics() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/analytics/class/${classId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAnalytics(response.data);
            } catch (err) {
                console.error('Error fetching analytics:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [classId, token]);

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

    const distributionData = {
        labels: ['F (<50)', 'D (50-69)', 'C (70-79)', 'B (80-89)', 'A (90-100)'],
        datasets: [
            {
                label: 'Number of Students',
                data: analytics?.gradeDistribution || [0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.6)',
                    'rgba(249, 115, 22, 0.6)',
                    'rgba(234, 179, 8, 0.6)',
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(34, 197, 94, 0.6)',
                ],
                borderColor: [
                    'rgb(239, 68, 68)',
                    'rgb(249, 115, 22)',
                    'rgb(234, 179, 8)',
                    'rgb(59, 130, 246)',
                    'rgb(34, 197, 94)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Class Grade Distribution',
            },
        },
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar classes={[]} userRole="TEACHER" />
            <main className="flex-1 ml-64 p-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate(`/teacher/class/${classId}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Class</span>
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-display font-bold text-gray-900">Class Analytics</h1>
                            <p className="text-gray-600">Performance insights and grade distribution</p>
                        </div>
                        <button className="btn-secondary flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                    </div>
                </motion.div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card p-6 border-l-4 border-primary-500"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Average Grade</h3>
                            <Award className="w-6 h-6 text-primary-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{analytics?.averageGrade || 0}%</p>
                        <p className="text-sm text-gray-600 mt-1">Class-wide average</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card p-6 border-l-4 border-success-500"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Submission Rate</h3>
                            <TrendingUp className="w-6 h-6 text-success-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{analytics?.submissionRate || 0}%</p>
                        <p className="text-sm text-gray-600 mt-1">Average turn-in rate</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card p-6 border-l-4 border-error-500"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">At-Risk Students</h3>
                            <AlertTriangle className="w-6 h-6 text-error-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{analytics?.atRiskStudents || 0}</p>
                        <p className="text-sm text-gray-600 mt-1">Students below 60%</p>
                    </motion.div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="card p-6"
                    >
                        <Bar options={chartOptions} data={distributionData} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="card p-6"
                    >
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-500" />
                            Engagement Overview
                        </h3>
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <p className="text-gray-500">More detailed engagement charts coming soon.</p>
                            <p className="text-xs text-gray-400 mt-2">(Login activity, time spent, etc.)</p>
                        </div>
                    </motion.div>
                </div>

                {/* Student Performance Lists */}
                {analytics?.studentPerformance && (
                    <div className="card p-6 mb-8">
                        <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary-500" />
                            Student Performance by Grade
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {['A', 'B', 'C', 'D', 'F'].map((grade) => {
                                const students = analytics.studentPerformance[grade] || [];
                                const colorMap = {
                                    'A': 'border-green-500 bg-green-50 text-green-700',
                                    'B': 'border-blue-500 bg-blue-50 text-blue-700',
                                    'C': 'border-yellow-500 bg-yellow-50 text-yellow-700',
                                    'D': 'border-orange-500 bg-orange-50 text-orange-700',
                                    'F': 'border-red-500 bg-red-50 text-red-700'
                                };
                                const badgeColor = colorMap[grade];

                                return (
                                    <div key={grade} className={`border-t-4 rounded-lg p-4 shadow-sm bg-white`}>
                                        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                            <h4 className="font-bold text-gray-800 text-lg">Grade {grade}</h4>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${badgeColor.replace('border-', '').replace('text-', 'bg-').replace('700', '200')}`}>
                                                {students.length} Student{students.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {students.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic">No students in this range</p>
                                        ) : (
                                            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                {students.map((student, idx) => (
                                                    <li key={idx} className="flex items-center justify-between text-sm group hover:bg-gray-50 p-1 rounded">
                                                        <span className="font-medium text-gray-700">{student.name}</span>
                                                        <span className={`font-mono font-bold ${grade === 'F' ? 'text-red-600' : 'text-gray-500'}`}>
                                                            {student.average}%
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default TeacherAnalytics;
