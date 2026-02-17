import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
    Plus,
    Users,
    FileText,
    Link as LinkIcon,
    MoreVertical,
    LogOut,
    GraduationCap,
    Bell
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

function StudentDashboard() {
    const { user, logout } = useAuth();
    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [openJoinDialog, setOpenJoinDialog] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
    const [unreadAnnouncements, setUnreadAnnouncements] = useState([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

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
            fetchEnrolledClasses();
        }
    }, [user]);

    // Fetch unread announcements
    useEffect(() => {
        const fetchUnreadAnnouncements = async () => {
            if (!id || enrolledClasses.length === 0) return;
            
            try {
                const classIds = enrolledClasses.map(cls => cls.id);
                const [countResponse, listResponse] = await Promise.all([
                    axios.post(
                        `http://localhost:8080/api/notifications/student/${id}/unread/count`,
                        classIds,
                        { headers: { Authorization: `Bearer ${token}` } }
                    ),
                    axios.post(
                        `http://localhost:8080/api/notifications/student/${id}/unread`,
                        classIds,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                ]);
                setUnreadAnnouncementsCount(countResponse.data.count || 0);
                setUnreadAnnouncements(listResponse.data || []);
            } catch (err) {
                console.error('Error fetching unread announcements:', err);
            }
        };

        if (id && enrolledClasses.length > 0) {
            fetchUnreadAnnouncements();
            // Refresh every 30 seconds
            const interval = setInterval(fetchUnreadAnnouncements, 30000);
            return () => clearInterval(interval);
        }
    }, [id, token, enrolledClasses]);

    // Handle notification click - mark as read and navigate to class
    const handleNotificationClick = async (notification) => {
        try {
            // Mark as read
            await axios.put(
                `http://localhost:8080/api/notifications/${notification.id}/read/${id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Update local state
            setUnreadAnnouncements(prev => prev.filter(n => n.id !== notification.id));
            setUnreadAnnouncementsCount(prev => Math.max(0, prev - 1));
            setNotificationsOpen(false);
            
            // Navigate to class page
            navigate(`/class/${notification.classId}`);
        } catch (err) {
            console.error('Error marking notification as read:', err);
            // Still navigate even if marking as read fails
            navigate(`/class/${notification.classId}`);
        }
    };

    const getInitials = (name) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const fetchEnrolledClasses = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/classes/student/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const processedClasses = await Promise.all(
                response.data.map(async (cls) => {
                    try {
                        const [teacherResponse, quickLinksResponse] = await Promise.all([
                            axios.get(`http://localhost:8080/api/users/${cls.teacherId}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            }),
                            axios.get(`http://localhost:8080/api/quicklinks/class/${cls.id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            })
                        ]);

                        return {
                            ...cls,
                            teacherName: typeof teacherResponse.data === 'string' ? teacherResponse.data : (teacherResponse.data.name || teacherResponse.data.username),
                            teacherInitials: getInitials(typeof teacherResponse.data === 'string' ? teacherResponse.data : (teacherResponse.data.name || teacherResponse.data.username)),
                            quickLinks: quickLinksResponse.data || [],
                            studentCount: cls.studentIds ? cls.studentIds.length : 0
                        };
                    } catch (err) {
                        return {
                            ...cls,
                            teacherName: "Unknown Teacher",
                            teacherInitials: "T",
                            quickLinks: [],
                            studentCount: cls.studentIds ? cls.studentIds.length : 0
                        };
                    }
                })
            );

            setEnrolledClasses(processedClasses);
        } catch (err) {
            console.error('Error fetching enrolled classes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClass = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post(
                'http://localhost:8080/api/classes/student/join-class',
                {
                    id: id,
                    classCode: classCode
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                fetchEnrolledClasses();
                setOpenJoinDialog(false);
                setClassCode('');
            }
        } catch (err) {
            console.error('Error joining class:', err);
            setError(err.response?.data || "Failed to join class. Please check the code.");
        }
    };

    const handleUnenroll = async (classId) => {
        if (window.confirm("Are you sure you want to unenroll from this class?")) {
            // API call placeholder - optimistic UI update
            setEnrolledClasses(enrolledClasses.filter(c => c.id !== classId));
        }
    };

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
            <Sidebar classes={enrolledClasses} userRole="STUDENT" />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-gray-900">My Classes</h1>
                        <p className="text-gray-600 mt-1">Access your courses and assignments</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications Icon with Dropdown */}
                        <Popover.Root open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                            <Popover.Trigger asChild>
                                <button
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                                    title="Announcements"
                                >
                                    <Bell className="w-6 h-6 text-gray-700" />
                                    {unreadAnnouncementsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {unreadAnnouncementsCount > 9 ? '9+' : unreadAnnouncementsCount}
                                        </span>
                                    )}
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto z-50"
                                    sideOffset={5}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">Announcements</h3>
                                        {unreadAnnouncementsCount > 0 && (
                                            <span className="bg-error-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                {unreadAnnouncementsCount} new
                                            </span>
                                        )}
                                    </div>
                                    {unreadAnnouncements.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            No new announcements
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {unreadAnnouncements.map((notification) => {
                                                const classData = enrolledClasses.find(c => c.id === notification.classId);
                                                return (
                                                    <button
                                                        key={notification.id}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-gray-500 mb-1">
                                                                    {classData?.name || 'Class'}
                                                                </p>
                                                                <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">
                                                                    {notification.title}
                                                                </h4>
                                                                <p className="text-xs text-gray-600 line-clamp-2">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {new Date(notification.createdAt).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            {notification.priority === 'high' && (
                                                                <span className="bg-error-100 text-error-700 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                                                    High
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>

                        <Dialog.Root open={openJoinDialog} onOpenChange={setOpenJoinDialog}>
                            <Dialog.Trigger asChild>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Join Class
                                </motion.button>
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50">
                                    <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                                        Join a Class
                                    </Dialog.Title>
                                    <form onSubmit={handleJoinClass} className="space-y-4">
                                        <p className="text-sm text-gray-600">
                                            Ask your teacher for the class code, then enter it here.
                                        </p>
                                        <div>
                                            <input
                                                type="text"
                                                value={classCode}
                                                onChange={(e) => setClassCode(e.target.value)}
                                                placeholder="Class Code"
                                                className="input-field w-full"
                                                required
                                            />
                                            {error && (
                                                <p className="text-sm text-error-600 mt-2">{error}</p>
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setOpenJoinDialog(false)}
                                                className="btn-ghost"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!classCode}
                                                className="btn-primary"
                                            >
                                                Join
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                    </div>
                </div>

                {/* Grid */}
                {enrolledClasses.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No classes yet</h3>
                        <p className="text-gray-500 mb-4">Join a class to get started</p>
                        <button
                            onClick={() => setOpenJoinDialog(true)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Join a class
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {enrolledClasses.map((cls, index) => (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col h-full"
                            >
                                <div
                                    className="h-40 p-4 relative cursor-pointer bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                    style={{
                                        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${backgroundImages[index % backgroundImages.length]})`
                                    }}
                                    onClick={() => navigate(`/class/${cls.id}`)}
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
                                                            handleUnenroll(cls.id);
                                                        }}
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Unenroll
                                                    </DropdownMenu.Item>
                                                </DropdownMenu.Content>
                                            </DropdownMenu.Portal>
                                        </DropdownMenu.Root>
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4 text-white">
                                        <h2 className="text-xl font-bold truncate mb-1">{cls.name}</h2>
                                        <p className="text-white/80 text-sm truncate">{cls.section || 'Class Section'}</p>
                                    </div>

                                    <div className="absolute -bottom-6 right-4 w-12 h-12 rounded-full bg-white p-1 shadow-lg">
                                        <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                                            {cls.teacherInitials || 'T'}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 pt-8 flex-1 flex flex-col gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium text-gray-900">Teacher:</span> {cls.teacherName || 'Unknown'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium text-gray-900">Students:</span> {cls.studentCount}
                                        </p>
                                    </div>

                                    {cls.quickLinks && cls.quickLinks.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Quick Links</p>
                                            <div className="flex flex-wrap gap-2">
                                                {cls.quickLinks.slice(0, 3).map((link, i) => (
                                                    <a
                                                        key={i}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs flex items-center gap-1 bg-primary-50 text-primary-700 px-2 py-1 rounded hover:bg-primary-100 transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <LinkIcon className="w-3 h-3" />
                                                        <span className="truncate max-w-[100px]">{link.title}</span>
                                                    </a>
                                                ))}
                                                {cls.quickLinks.length > 3 && (
                                                    <span className="text-xs text-gray-500 flex items-center px-1">+{cls.quickLinks.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/class/${cls.id}/assignments`);
                                            }}
                                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors col-span-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            View Assignments
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default StudentDashboard;
