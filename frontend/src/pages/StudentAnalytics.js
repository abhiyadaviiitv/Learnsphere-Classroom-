import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    ArrowLeft,
    Award,
    TrendingUp,
    BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function StudentAnalytics() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    const studentId = localStorage.getItem('id');

    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
        studentAverage: 0,
        classAverage: 0,
        completionRate: 0,
        assignmentComparisons: []
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!classId || !studentId) return;
            try {
                setLoading(true);
                const response = await axios.get(
                    `http://localhost:8080/api/analytics/class/${classId}/student/${studentId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setAnalytics(response.data);
            } catch (err) {
                console.error('Error fetching analytics:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [classId, studentId, token]);

    const comparisonData = analytics.assignmentComparisons || [];

    const data = {
        labels: comparisonData.map(c => c.assignmentTitle),
        datasets: [
            {
                label: 'My Score',
                data: comparisonData.map(c => c.studentScore),
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
            },
            {
                label: 'Class Average',
                data: comparisonData.map(c => c.classAverage),
                backgroundColor: 'rgba(156, 163, 175, 0.5)',
                borderColor: 'rgb(156, 163, 175)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Performance by Assignment',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Score (%)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Assignments'
                }
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar classes={[]} userRole="STUDENT" />
            <main className="flex-1 ml-64 p-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate(`/class/${classId}`)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Class</span>
                    </button>

                    <h1 className="text-3xl font-display font-bold text-gray-900">My Analytics</h1>
                    <p className="text-gray-600">Track your progress and performance</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-6 border-l-4 border-primary-500"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">My Average</h3>
                            <Award className="w-6 h-6 text-primary-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{analytics.studentAverage}%</p>
                        <p className="text-sm text-gray-600 mt-1">across all assignments</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card p-6 border-l-4 border-success-500"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Completion Rate</h3>
                            <TrendingUp className="w-6 h-6 text-success-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{analytics.completionRate}%</p>
                        <p className="text-sm text-gray-600 mt-1">assignments turned in</p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="card p-4"
                >
                    <div className="h-96 w-full">
                        <Bar data={data} options={{ ...options, maintainAspectRatio: false }} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
                        <p>Note: Detailed assignment-level analytics are currently simulated.</p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

export default StudentAnalytics;
