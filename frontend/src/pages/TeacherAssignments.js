import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft,
  Plus,
  FileText,
  Calendar,
  Users,
  Download,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

function TeacherAssignments() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Create Assignment State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    pointsPossible: 100
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchClassAndAssignments = async () => {
      try {
        // Fetch Assignments
        const assignmentsRes = await axios.get(`http://localhost:8080/api/assignments/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allAssignments = assignmentsRes.data || [];

        // Fetch Class Data (for student count)
        const classRes = await axios.get(`http://localhost:8080/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudentCount(classRes.data?.studentIds?.length || 0);

        // Fetch submission count and check for late submissions for each assignment
        const assignmentsWithSubmissions = await Promise.all(
          allAssignments.map(async (assignment) => {
            try {
              // Fetch all submissions for this assignment
              const submissionsResponse = await axios.get(
                `http://localhost:8080/api/submissions/assignment/${assignment.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const submissions = submissionsResponse.data || [];
              const submissionCount = Array.isArray(submissions) ? submissions.length : 0;
              
              // Check if any submission is late (submissionDate > dueDate)
              let hasLateSubmissions = false;
              if (assignment.dueDate && submissions.length > 0) {
                const dueDate = new Date(assignment.dueDate);
                hasLateSubmissions = submissions.some(submission => {
                  if (submission.submissionDate) {
                    const submissionDate = new Date(submission.submissionDate);
                    return submissionDate > dueDate;
                  }
                  return false;
                });
              }
              
              return {
                ...assignment,
                submissionCount: submissionCount,
                hasLateSubmissions: hasLateSubmissions
              };
            } catch (err) {
              console.error(`Error fetching submissions for assignment ${assignment.id}:`, err);
              return {
                ...assignment,
                submissionCount: 0,
                hasLateSubmissions: false
              };
            }
          })
        );
        
        setAssignments(assignmentsWithSubmissions);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchClassAndAssignments();
    }
  }, [classId, token]);

  const handleCreateAssignment = async () => {
    try {
      await axios.post(`http://localhost:8080/api/assignments`, {
        ...newAssignment,
        classId: classId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh assignments
      const response = await axios.get(`http://localhost:8080/api/assignments/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data || []);
      setCreateDialogOpen(false);
      setNewAssignment({ title: '', description: '', dueDate: '', pointsPossible: 100 });
    } catch (err) {
      console.error('Error creating assignment:', err);
      alert('Failed to create assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await axios.delete(`http://localhost:8080/api/assignments/${assignmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignments(assignments.filter(a => a.id !== assignmentId));
      } catch (err) {
        console.error('Error deleting assignment:', err);
        alert('Failed to delete assignment');
      }
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
      <Sidebar classes={[]} userRole="TEACHER" />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/teacher/class/${classId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Class</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">Assignments</h1>
              <p className="text-gray-600 mt-1">Manage classwork and grading</p>
            </div>

            <Dialog.Root open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <Dialog.Trigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Assignment
                </motion.button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50">
                  <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                    New Assignment
                  </Dialog.Title>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                        className="input-field w-full"
                        placeholder="e.g. Research Paper"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                      <textarea
                        value={newAssignment.description}
                        onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                        className="input-field w-full h-32 resize-none"
                        placeholder="Detailed instructions for the assignment..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input
                          type="datetime-local"
                          value={newAssignment.dueDate}
                          onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                        <input
                          type="number"
                          value={newAssignment.pointsPossible}
                          onChange={(e) => setNewAssignment({ ...newAssignment, pointsPossible: parseInt(e.target.value) })}
                          className="input-field w-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        onClick={() => setCreateDialogOpen(false)}
                        className="btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateAssignment}
                        disabled={!newAssignment.title || !newAssignment.dueDate}
                        className="btn-primary"
                      >
                        Create Assignment
                      </button>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
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
            assignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card p-6 hover:shadow-md transition-shadow cursor-pointer group ${
                  assignment.hasLateSubmissions ? 'border-2 border-error-300 bg-error-50' : ''
                }`}
                onClick={() => navigate(`/teacher/class/${classId}/assignments/${assignment.id}/submissions`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.title}
                        </h3>
                        {assignment.hasLateSubmissions && (
                          <span className="px-2 py-1 bg-error-100 text-error-700 text-xs rounded-full font-medium">
                            Late Submissions
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className={`flex items-center gap-1.5 ${assignment.hasLateSubmissions ? 'text-error-700 font-medium' : ''}`}>
                          <Calendar className={`w-4 h-4 ${assignment.hasLateSubmissions ? 'text-error-600' : ''}`} />
                          <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{assignment.submissionCount || 0}/{studentCount} Submitted</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{assignment.points || 0} pts</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teacher/class/${classId}/assignments/${assignment.id}/submissions`);
                      }}
                      className="btn-secondary text-sm"
                    >
                      View Submissions
                    </button>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          className="bg-white rounded-lg shadow-xl border border-gray-100 p-1 min-w-[160px] z-50"
                          sideOffset={5}
                        >
                          <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Edit functionality to be implemented
                            }}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-md cursor-pointer outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAssignment(assignment.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default TeacherAssignments;