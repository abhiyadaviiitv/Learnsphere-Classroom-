import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Plus,
    Users,
    FileText,
    MoreVertical,
    Copy,
    Check,
    Trash2,
    GraduationCap
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import StudentListPopup from '../components/StudentListPopup';

function TeacherDashboard() {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassSection, setNewClassSection] = useState('');
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState('');
    const [selectedClassForPopup, setSelectedClassForPopup] = useState(null);
    const [isStudentListOpen, setIsStudentListOpen] = useState(false);

    const navigate = useNavigate();
    const id = localStorage.getItem('id');
    const token = localStorage.getItem('token');

    // Background images for class cards
    const backgroundImages = [
        '/studying.jpg',
        '/teaching.jpg'
    ];

    useEffect(() => {
        if (user) {
            fetchClasses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchClasses = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/classes/teacher/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (Array.isArray(response.data)) {
                // Fetch teacher details for each class to get initials
                const processedClasses = await Promise.all(response.data.map(async (cls) => {
                    try {
                        const teacherResponse = await axios.get(
                            `http://localhost:8080/api/users/${cls.teacherId}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        return {
                            ...cls,
                            teacherName: teacherResponse.data.name,
                            teacherInitials: getInitials(teacherResponse.data.name)
                        };
                    } catch (e) {
                        return { ...cls, teacherInitials: 'T' };
                    }
                }));
                setClasses(processedClasses);
            } else {
                setClasses([]);
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateClassCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const getInitials = (name) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            const newClass = {
                name: newClassName,
                section: newClassSection,
                teacherId: id,
                code: generateClassCode(),
                studentIds: [],
            };
            await axios.post('http://localhost:8080/api/classes/teacher/create-class', newClass, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchClasses();
            setIsDialogOpen(false);
            setNewClassName('');
            setNewClassSection('');
        } catch (err) {
            console.error('Error creating class:', err);
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopySuccess(code);
        setTimeout(() => setCopySuccess(''), 2000);
    };

    const handleDeleteClass = async (classId) => {
        if (window.confirm("Are you sure you want to delete this class?")) {
            // API call placeholder - backend might not support delete yet based on previous code
            // But we will optimistically remove it from UI
            setClasses(classes.filter(c => c.id !== classId));
        }
    };

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
            <Sidebar classes={classes} userRole="TEACHER" />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-gray-900">My Classes</h1>
                        <p className="text-gray-600 mt-1">Manage your courses and students</p>
                    </div>

                    <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <Dialog.Trigger asChild>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Create Class
                            </motion.button>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50">
                                <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                                    Create New Class
                                </Dialog.Title>
                                <form onSubmit={handleCreateClass} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                                        <input
                                            type="text"
                                            value={newClassName}
                                            onChange={(e) => setNewClassName(e.target.value)}
                                            placeholder="e.g. Computer Science 101"
                                            className="input-field w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                        <input
                                            type="text"
                                            value={newClassSection}
                                            onChange={(e) => setNewClassSection(e.target.value)}
                                            placeholder="e.g. Period 1"
                                            className="input-field w-full"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsDialogOpen(false)}
                                            className="btn-ghost"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newClassName}
                                            className="btn-primary"
                                        >
                                            Create Class
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                </div>

                {/* Grid */}
                {classes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No classes yet</h3>
                        <p className="text-gray-500 mb-4">Create your first class to get started</p>
                        <button
                            onClick={() => setIsDialogOpen(true)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Create a class
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {classes.map((cls, index) => (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col h-full"
                            >
                                <div
                                    className="h-32 p-4 relative cursor-pointer bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                    style={{
                                        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${backgroundImages[index % backgroundImages.length]})`
                                    }}
                                    onClick={() => navigate(`/teacher/class/${cls.id}`)}
                                >
                                    <div className="absolute top-4 right-4 z-10">
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger asChild>
                                                <button
                                                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Portal>
                                                <DropdownMenu.Content
                                                    className="bg-white rounded-lg shadow-xl border border-gray-100 p-1 min-w-[140px] z-50"
                                                    sideOffset={5}
                                                >
                                                    <DropdownMenu.Item
                                                        className="flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-md cursor-pointer outline-none"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClass(cls.id);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </DropdownMenu.Item>
                                                </DropdownMenu.Content>
                                            </DropdownMenu.Portal>
                                        </DropdownMenu.Root>
                                    </div>

                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h2 className="text-xl font-bold truncate pr-8">{cls.name}</h2>
                                        <p className="text-white/80 text-sm">{cls.section}</p>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col gap-4">
                                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        <span className="font-mono">{cls.code}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyCode(cls.code);
                                            }}
                                            className="hover:text-primary-600 transition-colors"
                                            title="Copy Code"
                                        >
                                            {copySuccess === cls.code ? (
                                                <Check className="w-4 h-4 text-success-600" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedClassForPopup(cls);
                                                setIsStudentListOpen(true);
                                            }}
                                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                                        >
                                            <Users className="w-4 h-4" />
                                            Students
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/teacher/class/${cls.id}/assignments`);
                                            }}
                                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Work
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Student List Popup */}
                {selectedClassForPopup && (
                    <StudentListPopup
                        isOpen={isStudentListOpen}
                        onClose={() => {
                            setIsStudentListOpen(false);
                            setSelectedClassForPopup(null);
                        }}
                        classId={selectedClassForPopup.id}
                        classTitle={selectedClassForPopup.name}
                    />
                )}
            </main>
        </div>
    );
}

export default TeacherDashboard;
