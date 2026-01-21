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

function StudentClassDetails() {
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
  const [newQueryText, setNewQueryText] = useState('');
  const [studentListOpen, setStudentListOpen] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState({ isLive: false, roomId: null });
  const [wsConnected, setWsConnected] = useState(false);
  const [quickLinks, setQuickLinks] = useState([]);
  const token = localStorage.getItem('token');
  const studentId = localStorage.getItem('id');

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

  // Fetch queries (student's own queries)
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/queries/class/${classId}/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQueries(response.data || []);
      } catch (err) {
        console.error('Error fetching queries:', err);
        setQueries([]);
      }
    };

    if (classId && studentId) {
      fetchQueries();
      // Refresh queries every 30 seconds
      const interval = setInterval(fetchQueries, 30000);
      return () => clearInterval(interval);
    }
  }, [classId, studentId, token]);

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
        const allAssignments = response.data || [];

        // Sort by due date (ascending - earliest first), then take last 2 (most recent)
        const sortedAssignments = [...allAssignments].sort((a, b) => {
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return dateA - dateB; // Ascending order
        });

        // Take last 2 assignments (closest due dates)
        const lastTwoAssignments = sortedAssignments.slice(-2);

        // Fetch submission count and student submission for each assignment
        const assignmentsWithSubmissions = await Promise.all(
          lastTwoAssignments.map(async (assignment) => {
            try {
              // Fetch all submissions for this assignment to get count
              const submissionsResponse = await axios.get(
                `http://localhost:8080/api/submissions/assignment/${assignment.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const submissions = submissionsResponse.data || [];
              const submissionCount = Array.isArray(submissions) ? submissions.length : 0;

              // Fetch student's own submission (if exists) to check if it's late
              let studentSubmission = null;
              let isLate = false;
              try {
                const studentSubmissionResponse = await axios.get(
                  `http://localhost:8080/api/submissions/${assignment.id}/${studentId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                if (studentSubmissionResponse.data && studentSubmissionResponse.status !== 204) {
                  studentSubmission = studentSubmissionResponse.data;
                  // Check if submission is late: submissionDate > dueDate
                  if (studentSubmission.submissionDate && assignment.dueDate) {
                    const submissionDate = new Date(studentSubmission.submissionDate);
                    const dueDate = new Date(assignment.dueDate);
                    isLate = submissionDate > dueDate;
                  }
                }
              } catch (err) {
                // Student hasn't submitted - not an error
                if (err.response?.status !== 404 && err.response?.status !== 204) {
                  console.error(`Error fetching student submission for assignment ${assignment.id}:`, err);
                }
              }

              return {
                ...assignment,
                submissionCount: submissionCount,
                studentSubmission: studentSubmission,
                isLate: isLate
              };
            } catch (err) {
              console.error(`Error fetching submissions for assignment ${assignment.id}:`, err);
              return {
                ...assignment,
                submissionCount: 0,
                studentSubmission: null,
                isLate: false
              };
            }
          })
        );

        setRecentAssignments(assignmentsWithSubmissions);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setRecentAssignments([]);
      }
    };

    const fetchQuickLinks = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/quicklinks/class/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuickLinks(response.data || []);
      } catch (err) {
        console.error('Error fetching quicklinks:', err);
        setQuickLinks([]);
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

  const handleJoinMeeting = async () => {
    if (!meetingStatus.isLive) {
      alert('Meeting is not active. Please wait for the teacher to start the meeting.');
      return;
    }

    try {
      // Get SSO token for joining (student, not host)
      const tokenResponse = await axios.get(
        `http://localhost:8080/api/meetings/class/${classId}/join-token`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect to Connective with SSO token
      // Use isHost=false and autoJoined=false to trigger joinRoom call (like Connective's joinRoom pattern)
      // IMPORTANT: SSO endpoint is on Connective BACKEND (port 4000), not frontend
      const connectiveBackendUrl = process.env.REACT_APP_CONNECTIVE_BACKEND_URL || 'https://localhost:4000';
      const ssoUrl = `${connectiveBackendUrl}/auth/sso/learnsphere?token=${encodeURIComponent(tokenResponse.data.token)}&roomId=${encodeURIComponent(meetingStatus.roomId)}&isHost=false&returnUrl=/room/${encodeURIComponent(meetingStatus.roomId)}`;

      console.log('Redirecting student to Connective SSO endpoint:', ssoUrl);
      console.log('Connective backend URL:', connectiveBackendUrl);
      window.location.href = ssoUrl;
    } catch (err) {
      console.error('Error joining meeting:', err);
      alert('Failed to join meeting: ' + (err.response?.data?.error || err.message));
    }
  };





  const handleSubmitQuery = async () => {
    if (!newQueryText.trim()) return;
    try {
      const response = await axios.post(
        `http://localhost:8080/api/queries/class/${classId}`,
        {
          classId: classId,
          studentId: studentId,
          question: newQueryText,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQueries(prev => [response.data, ...prev]);
      setNewQueryText('');
    } catch (err) {
      console.error('Error submitting query:', err);
      setError(err.response?.data?.error || 'Failed to submit query');
    }
  };

  const studentCount = classData?.studentIds?.length || 0;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar classes={[]} userRole="STUDENT" />
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
        <Sidebar classes={[]} userRole="STUDENT" />
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
        <Sidebar classes={[]} userRole="STUDENT" />
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
      <Sidebar classes={[]} userRole="STUDENT" />

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
              onClick={() => navigate(`/class/${classId}/assignments/create`)}
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
                  onClick={() => navigate(`/class/${classId}/assignments`)}
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
                  onClick={() => navigate(`/class/${classId}/analytics`)}
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
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Quick Links
                </h2>
              </div>
              <div className="p-4 space-y-2">
                {quickLinks.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No quick links yet
                  </div>
                ) : (
                  quickLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">{link.title}</span>
                    </a>
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
                {unreadNotifications > 0 && (
                  <span className="bg-white text-warning-600 text-xs font-bold px-2 py-1 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              <div className="p-2">
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No announcements yet
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const isUnread = !notification.readBy?.includes(studentId);
                      return (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border transition-colors cursor-pointer ${isUnread
                              ? 'bg-primary-50 border-primary-200 hover:bg-primary-100'
                              : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                            }`}
                          onClick={async () => {
                            console.log("Notification clicked", notification.id);
                            if (isUnread) {
                              try {
                                console.log("Marking as read...");
                                await axios.put(
                                  `http://localhost:8080/api/notifications/${notification.id}/read/${studentId}`,
                                  {},
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );
                                console.log("Marked as read, refreshing...");
                                // Refresh notifications to update read status
                                const response = await axios.get(`http://localhost:8080/api/notifications/class/${classId}`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                setNotifications(response.data || []);
                              } catch (err) {
                                console.error('Error marking notification as read:', err);
                              }
                            } else {
                              console.log("Notification already read");
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              {isUnread && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                              )}
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
                          </div>
                          <p className="text-xs text-gray-700 mb-2 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                      );
                    })
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
                <motion.button
                  whileHover={{ scale: meetingStatus.isLive ? 1.05 : 1 }}
                  whileTap={{ scale: meetingStatus.isLive ? 0.95 : 1 }}
                  onClick={handleJoinMeeting}
                  disabled={!meetingStatus.isLive}
                  className={`flex items-center gap-2 ${meetingStatus.isLive
                    ? 'btn-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <Video className="w-5 h-5" />
                  {meetingStatus.isLive ? 'Join Meeting' : 'Meeting Not Active'}
                </motion.button>
              </div>
              {meetingStatus.isLive ? (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Meeting is active. Click "Join Meeting" to enter.
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Waiting for teacher to start the meeting...
                  </p>
                </div>
              )}
              {!wsConnected && (
                <p className="text-xs text-gray-500 mt-2">
                  Connecting to real-time updates...
                </p>
              )}
            </div>

            {/* Queries & Comments Section - Student View */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-success-500 to-success-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-display font-bold text-white">Your Queries</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <textarea
                    className="input-field w-full"
                    rows={3}
                    placeholder="Ask a question or leave a comment for your teacher..."
                    value={newQueryText}
                    onChange={(e) => setNewQueryText(e.target.value)}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitQuery}
                    disabled={!newQueryText.trim()}
                    className="btn-primary mt-3 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Query
                  </motion.button>
                </div>

                {queries.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No queries submitted yet.</p>
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
                                {query.studentName?.charAt(0) || 'Y'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{query.studentName || 'You'}</h4>
                                <p className="text-xs text-gray-500">{new Date(query.createdAt).toLocaleString()}</p>
                              </div>
                              {!query.answer && (
                                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                                  Awaiting Answer
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 mt-2 mb-3">{query.question}</p>
                            {query.answer && (
                              <div className="mt-3 p-3 bg-success-50 border border-success-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <GraduationCap className="w-4 h-4 text-success-600" />
                                  <span className="text-xs font-semibold text-success-700">Teacher's Answer:</span>
                                </div>
                                <p className="text-sm text-gray-700">{query.answer}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Assignments */}
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
                <h2 className="text-xl font-display font-bold text-white">Recent Assignments</h2>
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
                        className={`card p-5 hover:shadow-lg transition-shadow cursor-pointer ${assignment.isLate ? 'border-2 border-error-300 bg-error-50' : ''
                          }`}
                        onClick={() => navigate(`/assignment/${assignment.id}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {assignment.title}
                              </h3>
                              {assignment.isLate && (
                                <span className="px-2 py-1 bg-error-100 text-error-700 text-xs rounded-full font-medium">
                                  Late Submitted
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className={`w-4 h-4 ${assignment.isLate ? 'text-error-600' : ''}`} />
                                <span className={assignment.isLate ? 'text-error-700 font-medium' : ''}>
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>
                                  {assignment.submissionCount || 0}/{studentCount} Submitted {assignment.points ? `${assignment.points} pts` : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/assignment/${assignment.id}`);
                            }}
                            className="btn-ghost text-sm py-2 flex-1"
                          >
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/assignment/${assignment.id}`);
                            }}
                            className="btn-primary text-sm py-2 flex-1"
                          >
                            View Assignment
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
                    <p className="text-gray-600">Your teacher hasn't created any assignments for this class yet.</p>
                  </div>
                )}

                {recentAssignments.length > 0 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => navigate(`/class/${classId}/assignments`)}
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


        {/* Student List Popup */}
        <StudentListPopup
          isOpen={studentListOpen}
          onClose={() => setStudentListOpen(false)}
          classId={classId}
          classTitle={classData?.name || 'Class'}
        />
      </main>
    </div>
  );
}

export default StudentClassDetails;
