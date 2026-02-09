import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, School, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const RoleSelection = () => {
    const navigate = useNavigate();
    const { fetchUserProfileAndStore } = useAuth(); // We'll re-fetch profile after update
    const [loading, setLoading] = useState(false);

    const handleRoleSelect = async (role) => {
        setLoading(true);
        try {
            await api.post('/update-role', { role });

            // Refresh profile to update context/local storage
            await fetchUserProfileAndStore();

            // Navigate to dashboard
            navigate('/dashboard');
            // No need to reload, context update should handle it
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
                        Welcome to LearnSphere
                    </h1>
                    <p className="text-xl text-gray-600">
                        How will you be using Classroom today?
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 px-4">
                    {/* Student Card */}
                    <motion.button
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRoleSelect('STUDENT')}
                        disabled={loading}
                        className="group relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-gray-100 text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <User className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">I am a Student</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Join classes, access learning materials, submit assignments, and track your progress in real-time.
                            </p>
                        </div>
                    </motion.button>

                    {/* Teacher Card */}
                    <motion.button
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRoleSelect('TEACHER')}
                        disabled={loading}
                        className="group relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-gray-100 text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <School className="w-10 h-10 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">I am a Teacher</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Create and manage classes, post assignments, grade submissions, and communicate with your students.
                            </p>
                        </div>
                    </motion.button>
                </div>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-8 text-center text-primary-600 font-medium"
                    >
                        Setting up your profile...
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default RoleSelection;
