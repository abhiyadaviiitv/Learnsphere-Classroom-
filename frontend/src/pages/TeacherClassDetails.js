import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Plus,
  Users,
  FileText,
  Award,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  Hash,
  GraduationCap,
  X,
  Bell,
  MessageSquare,
  Video,
  Link as LinkIcon,
  ExternalLink,
  Send,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import StudentListPopup from '../components/StudentListPopup';
import * as Popover from '@radix-ui/react-popover';
import * as Dialog from '@radix-ui/react-dialog';

function TeacherClassDetails() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classData, setClassData] = useState(null);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [queries, setQueries] = useState([]);
  const [newQueriesCount, setNewQueriesCount] = useState(0);
  const [queriesOpen, setQueriesOpen] = useState(false);
  const [newQueryText, setNewQueryText] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [createNotificationOpen, setCreateNotificationOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({ title: '', message: '', priority: 'normal' });
  const [studentListOpen, setStudentListOpen] = useState(false);
  const token = localStorage.getItem('token');
  const teacherId = localStorage.getItem('id');

  // Quick Links State
  const [quickLinks, setQuickLinks] = useState([]);
  const [openQuickLinkDialog, setOpenQuickLinkDialog] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Fetch quick links
  const fetchQuickLinks = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/quicklinks/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuickLinks(response.data);
    } catch (err) {
      console.error('Error fetching quick links:', err);
    }
  };

  const handleAddQuickLink = async () => {
    if (!newLinkTitle || !newLinkUrl) return;
    try {
      await axios.post(`http://localhost:8080/api/quicklinks`, {
        title: newLinkTitle,
        url: newLinkUrl,
        classId: classId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewLinkTitle('');
      setNewLinkUrl('');
      setOpenQuickLinkDialog(false);
      fetchQuickLinks();
    } catch (err) {
      console.error('Error adding quick link:', err);
      alert('Failed to add quick link');
    }
  };

  const handleDeleteQuickLink = async (id) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/quicklinks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQuickLinks();
    } catch (err) {
      console.error('Error deleting quick link:', err);
    }
  };

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/notifications/class/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(response.data || []);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setNotifications([]);
      }
    };

    if (classId) {
      fetchNotifications();
    }
  }, [classId, token]);

  // Fetch queries
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/queries/class/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const queriesData = response.data || [];
        setQueries(queriesData);

        // Count unanswered queries
        const unanswered = queriesData.filter(q => !q.answer || q.answer.trim() === '').length;
        setNewQueriesCount(unanswered);
      } catch (err) {
        console.error('Error fetching queries:', err);
        setQueries([]);
      }
    };

    if (classId) {
      fetchQueries();
      // Refresh queries every 30 seconds
      const interval = setInterval(fetchQueries, 30000);
      return () => clearInterval(interval);
    }
  }, [classId, token]);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClassData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch class data');
        console.error('Error fetching class data:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentAssignments = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/assignments/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const assignments = response.data || [];
        // Sort by due date (ascending - earliest first) and take only 2 most recent
        const sortedAssignments = assignments
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 2);
        setRecentAssignments(sortedAssignments);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setRecentAssignments([]);
      }
    };

    fetchRecentAssignments();
    fetchClassData();
    fetchQuickLinks();
  }, [classId, token]);

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const handleCopyClassCode = () => {
    if (!classData?.code) return;
    navigator.clipboard.writeText(classData.code)
      .then(() => {
        setShowCopyTooltip(true);
        setTimeout(() => setShowCopyTooltip(false), 2000);
      })
      .catch(err => console.error('Could not copy text: ', err));
  };

  const [meetingStatus, setMeetingStatus] = useState({ isLive: false, roomId: null });
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket connection for real-time meeting updates
  useEffect(() => {
    if (!classId) return;

    // Connect to WebSocket using SockJS and STOMP
    const SockJS = require('sockjs-client');
    const { Client } = require('@stomp/stompjs');

    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
      
      // Subscribe to meeting updates for this class
      stompClient.subscribe(`/topic/class/${classId}/meeting`, (message) => {
        const event = JSON.parse(message.body);
        console.log('Meeting event received:', event);
        
        if (event.type === 'MEETING_STARTED') {
          setMeetingStatus({
            isLive: true,
            roomId: event.roomId,
            startedAt: event.startedAt
          });
        } else if (event.type === 'MEETING_STOPPED') {
          setMeetingStatus({ isLive: false, roomId: null });
        }
      });
    };

    stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      setWsConnected(false);
    };

    stompClient.activate();

    // Fetch initial meeting status
    const fetchMeetingStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/meetings/class/${classId}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMeetingStatus(response.data);
      } catch (err) {
        console.error('Error fetching meeting status:', err);
      }
    };
    fetchMeetingStatus();

    return () => {
      stompClient.deactivate();
    };
  }, [classId, token]);

  const handleStartMeeting = async () => {
    try {
      // Start the meeting (creates room ID in Learnsphere)
      const response = await axios.post(
        `http://localhost:8080/api/meetings/class/${classId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const roomId = response.data.roomId;
      if (!roomId) {
        alert('Failed to start meeting: No room ID returned');
        return;
      }

      // Get SSO token for teacher to auto-join (as host)
      const tokenResponse = await axios.get(
        `http://localhost:8080/api/meetings/class/${classId}/join-token`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!tokenResponse.data.token) {
        alert('Failed to get join token');
        return;
      }

      // Automatically redirect teacher to Connective meeting
      // Use isHost=true and autoJoined=true to match Connective's createRoom pattern
      // IMPORTANT: SSO endpoint is on Connective BACKEND (port 4000), not frontend
      const connectiveBackendUrl = process.env.REACT_APP_CONNECTIVE_BACKEND_URL || 'https://localhost:4000';
      const ssoUrl = `${connectiveBackendUrl}/auth/sso/learnsphere?token=${encodeURIComponent(tokenResponse.data.token)}&roomId=${encodeURIComponent(roomId)}&isHost=true&returnUrl=/room/${encodeURIComponent(roomId)}`;
      
      console.log('Redirecting teacher to Connective SSO endpoint:', ssoUrl);
      console.log('Connective backend URL:', connectiveBackendUrl);
      window.location.href = ssoUrl;
    } catch (err) {
      console.error('Error starting meeting:', err);
      alert('Failed to start meeting: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStopMeeting = async () => {
    if (!window.confirm('Are you sure you want to stop the meeting?')) return;

    try {
      await axios.post(
        `http://localhost:8080/api/meetings/class/${classId}/stop`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMeetingStatus({ isLive: false, roomId: null });
    } catch (err) {
      console.error('Error stopping meeting:', err);
      if (err.response?.status === 401) {
        const errorMsg = err.response?.data?.error || 'Unauthorized';
        if (errorMsg.includes('User ID not provided') || errorMsg.includes('User id is not provided')) {
          alert('Session expired. Please log out and log back in to refresh your token.');
        } else {
          alert('Failed to stop meeting: ' + errorMsg);
        }
      } else {
        alert('Failed to stop meeting: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) return;

    try {
      const response = await axios.post('http://localhost:8080/api/notifications', {
        classId: classId,
        title: newNotification.title,
        message: newNotification.message,
        priority: newNotification.priority
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => [response.data, ...prev]);
      setNewNotification({ title: '', message: '', priority: 'normal' });
      setCreateNotificationOpen(false);
    } catch (err) {
      console.error('Error creating announcement:', err);
      alert('Failed to create announcement. Please try again.');
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Failed to delete announcement. Please try again.');
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await axios.post(`http://localhost:8080/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, readBy: [...(n.readBy || []), teacherId] } : n
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleAnswerQuery = async (queryId, answer) => {
    try {
      await axios.put(`http://localhost:8080/api/queries/${queryId}/answer`, {
        answer: answer
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh queries
      const response = await axios.get(`http://localhost:8080/api/queries/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueries(response.data || []);
      setSelectedQuery(null);

      const unanswered = (response.data || []).filter(q => !q.answer || q.answer.trim() === '').length;
      setNewQueriesCount(unanswered);
    } catch (err) {
      console.error('Error answering query:', err);
      alert('Failed to answer query. Please try again.');
    }
  };

  const studentCount = classData?.studentIds?.length || 0;
  // Teachers don't have unread notifications - this is only for students
  const unreadNotifications = 0;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar classes={[]} userRole="TEACHER" />
        <main className="flex-1 ml-64 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Loading class details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar classes={[]} userRole="TEACHER" />
        <main className="flex-1 ml-64 p-8">
          <div className="card p-8 max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-error-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar classes={[]} userRole="TEACHER" />
        <main className="flex-1 ml-64 p-8">
          <div className="card p-8 max-w-md mx-auto text-center">
            <p className="text-gray-600">No class data found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar classes={[]} userRole="TEACHER" />

      <main className="flex-1 ml-64 p-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </motion.div>

        {/* Class Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-8 mb-8 bg-gradient-to-br from-primary-50 via-white to-purple-50 border-2 border-primary-100"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                    {classData?.name || 'Unnamed Class'}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                      {classData?.section || 'No section'}
                    </span>
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors">
                          <Hash className="w-4 h-4" />
                          Class Code: {classData?.code || 'N/A'}
                          <Copy className="w-3 h-3" />
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content
                          className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[280px]"
                          sideOffset={5}
                        >
                          <h4 className="font-semibold text-gray-900 mb-2">Class Code</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Share this code with your students
                          </p>
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                            <code className="flex-1 font-mono text-lg font-semibold text-gray-900">
                              {classData?.code}
                            </code>
                            <button
                              onClick={handleCopyClassCode}
                              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              {showCopyTooltip ? (
                                <Check className="w-5 h-5 text-success-600" />
                              ) : (
                                <Copy className="w-5 h-5 text-gray-600" />
                              )}
                            </button>
                          </div>
                          {showCopyTooltip && (
                            <p className="text-sm text-success-600">Code copied!</p>
                          )}
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  </div>
                </div>
              </div>

              {classData?.description && (
                <div className="mt-6 p-4 bg-white/60 rounded-lg border-l-4 border-primary-500">
                  <p className="text-gray-700 leading-relaxed">{classData.description}</p>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/teacher/class/${classId}/assignments/create`)}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <Plus className="w-5 h-5" />
              New Assignment
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Class Management */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
                <h2 className="text-xl font-display font-bold text-white">Class Management</h2>
              </div>
              <div className="p-2">
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStudentListOpen(true)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 transition-colors text-left group"
                >
                  <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-500 rounded-xl flex items-center justify-center transition-colors">
                    <Users className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Students</h3>
                    <p className="text-sm text-gray-600">{studentCount} enrolled</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/teacher/class/${classId}/assignments`)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 transition-colors text-left group mt-2"
                >
                  <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-500 rounded-xl flex items-center justify-center transition-colors">
                    <FileText className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Assignments</h3>
                    <p className="text-sm text-gray-600">View and manage assignments</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/teacher/class/${classId}/analytics`)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 transition-colors text-left group mt-2"
                >
                  <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-500 rounded-xl flex items-center justify-center transition-colors">
                    <Award className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-600">View performance & insights</p>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Quick Links
                </h2>
                <button
                  onClick={() => setOpenQuickLinkDialog(true)}
                  className="bg-white/20 hover:bg-white/30 text-white p-1 rounded transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {quickLinks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No links added yet.</p>
                ) : (
                  quickLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors group">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-700 flex-1 truncate"
                      >
                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{link.title}</span>
                      </a>
                      <button
                        onClick={() => handleDeleteQuickLink(link.id)}
                        className="text-gray-400 hover:text-error-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Announcements */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-warning-500 to-warning-600 p-4 flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Class Announcements
                </h2>
              </div>
              <div className="p-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCreateNotificationOpen(true)}
                  className="w-full btn-primary mb-3 flex items-center justify-center gap-2 text-sm py-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Announcement
                </motion.button>

                <div className="max-h-80 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No announcements yet
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 rounded-lg transition-colors bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900 truncate">
                                {notification.title}
                              </h4>
                              {notification.priority === 'high' && (
                                <span className="inline-block px-2 py-0.5 bg-error-100 text-error-700 text-xs rounded-full mt-1">
                                  High Priority
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-error-600 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-700 mb-2 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-500">{formatTime(notification.createdAt)}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Meeting Section */}
            <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
                  <Video className="w-6 h-6 text-blue-600" />
                  Video Conference
                  {meetingStatus.isLive && (
                    <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Live
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex gap-3">
                {!meetingStatus.isLive ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartMeeting}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Video className="w-5 h-5" />
                    Start Meeting
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartMeeting}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Video className="w-5 h-5" />
                      Join Meeting
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStopMeeting}
                      className="btn-secondary flex items-center gap-2 bg-red-500 hover:bg-red-600"
                    >
                      <Video className="w-5 h-5" />
                      Stop Meeting
                    </motion.button>
                  </>
                )}
              </div>
              {meetingStatus.isLive && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Meeting is active. Room ID: <code className="font-mono">{meetingStatus.roomId}</code>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Students can now join the meeting
                  </p>
                </div>
              )}
              {!wsConnected && (
                <p className="text-xs text-gray-500 mt-2">
                  Connecting to real-time updates...
                </p>
              )}
            </div>

            {/* Queries & Comments Section */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-success-500 to-success-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-display font-bold text-white">Queries & Comments</h2>
                  {newQueriesCount > 0 && (
                    <span className="bg-white text-success-600 text-xs font-bold px-2 py-1 rounded-full">
                      {newQueriesCount} new
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {queries.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No queries yet. Students can ask questions here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queries.map((query) => (
                      <motion.div
                        key={query.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`card p-5 ${!query.answer ? 'border-2 border-primary-200 bg-primary-50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {(query.studentName || 'S').charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{query.studentName || 'Student'}</h4>
                                <p className="text-xs text-gray-500">{formatTime(query.createdAt)}</p>
                              </div>
                              {!query.answer && (
                                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                                  Needs Answer
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 mt-2 mb-3">{query.question}</p>
                            {query.answer && (
                              <div className="mt-3 p-3 bg-success-50 border border-success-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <GraduationCap className="w-4 h-4 text-success-600" />
                                  <span className="text-xs font-semibold text-success-700">Your Answer:</span>
                                </div>
                                <p className="text-sm text-gray-700">{query.answer}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {!query.answer && (
                          <button
                            onClick={() => setSelectedQuery(query)}
                            className="btn-primary text-sm py-2 w-full"
                          >
                            Answer Query
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Assignments */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-white">Recent Assignments</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/teacher/class/${classId}/assignments/create`)}
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Assignment
                </motion.button>
              </div>

              <div className="p-6">
                {recentAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {recentAssignments.map((assignment, index) => (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ y: -2 }}
                        className="card p-5 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(`/teacher/class/${classId}/assignments/${assignment.id}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {assignment.title}
                            </h3>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>
                                  {assignment.submissionCount || 0}/{studentCount} submissions
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/teacher/class/${classId}/assignments/${assignment.id}`);
                            }}
                            className="btn-ghost text-sm py-2 flex-1"
                          >
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/teacher/class/${classId}/assignments/${assignment.id}/submissions`);
                            }}
                            className="btn-primary text-sm py-2 flex-1"
                          >
                            View Submissions
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments yet</h3>
                    <p className="text-gray-600 mb-6">Create your first assignment to get started</p>
                    <button
                      onClick={() => navigate(`/teacher/class/${classId}/assignments/create`)}
                      className="btn-primary"
                    >
                      Create Assignment
                    </button>
                  </div>
                )}

                {recentAssignments.length > 0 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => navigate(`/teacher/class/${classId}/assignments`)}
                      className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      View All Assignments ({recentAssignments.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Create Notification Dialog */}
        <Dialog.Root open={createNotificationOpen} onOpenChange={setCreateNotificationOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-primary-600" />
                  Create Class Announcement
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              <Dialog.Description className="text-gray-600 mb-6">
                Share important class information with all students
              </Dialog.Description>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Assignment Due Tomorrow"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-error-600">*</span>
                  </label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    className="input-field"
                    rows={4}
                    placeholder="Enter important class information..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newNotification.message.length}/500 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newNotification.priority}
                    onChange={(e) => setNewNotification({ ...newNotification, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button className="btn-ghost flex-1">Cancel</button>
                  </Dialog.Close>
                  <button
                    onClick={handleCreateNotification}
                    disabled={!newNotification.title.trim() || !newNotification.message.trim()}
                    className="btn-primary flex-1"
                  >
                    Create Announcement
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Answer Query Dialog */}
        <Dialog.Root open={!!selectedQuery} onOpenChange={() => setSelectedQuery(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50">
              <Dialog.Title className="text-xl font-display font-bold text-gray-900 mb-4">
                Answer Query
              </Dialog.Title>
              {selectedQuery && (
                <>
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Question from {selectedQuery.studentName || 'Student'}:</p>
                    <p className="text-gray-900 font-medium">{selectedQuery.question}</p>
                  </div>
                  <textarea
                    id="answer-input"
                    className="input-field mb-4"
                    rows={4}
                    placeholder="Type your answer here..."
                  />
                  <div className="flex gap-3">
                    <Dialog.Close asChild>
                      <button className="btn-ghost flex-1">Cancel</button>
                    </Dialog.Close>
                    <button
                      onClick={() => {
                        const answer = document.getElementById('answer-input').value;
                        if (answer.trim()) {
                          handleAnswerQuery(selectedQuery.id, answer);
                        }
                      }}
                      className="btn-primary flex-1"
                    >
                      Submit Answer
                    </button>
                  </div>
                </>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Quick Link Dialog */}
        <Dialog.Root open={openQuickLinkDialog} onOpenChange={setOpenQuickLinkDialog}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
                  <LinkIcon className="w-6 h-6 text-primary-600" />
                  Add Quick Link
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Google"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button className="btn-ghost flex-1">Cancel</button>
                  </Dialog.Close>
                  <button onClick={handleAddQuickLink} className="btn-primary flex-1">Add Link</button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Student List Popup */}
        <StudentListPopup
          isOpen={studentListOpen}
          onClose={() => setStudentListOpen(false)}
          classId={classId}
          studentIds={classData?.studentIds || []}
        />
      </main>
    </div>
  );
}

export default TeacherClassDetails;
