import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const StudentListPopup = ({ isOpen, onClose, classId, classTitle }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchStudents = async () => {
      if (!classId) return;
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8080/api/classes/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const classData = response.data;
        
        // Fetch student details for each studentId
        if (classData.studentIds && classData.studentIds.length > 0) {
          const studentPromises = classData.studentIds.map(async (studentId) => {
            try {
              const studentResponse = await axios.get(`http://localhost:8080/api/users/student/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return studentResponse.data;
            } catch (err) {
              console.error(`Error fetching student ${studentId}:`, err);
              return { id: studentId, username: 'Unknown', email: '' };
            }
          });
          const studentData = await Promise.all(studentPromises);
          setStudents(studentData);
        } else {
          setStudents([]);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && classId) {
      fetchStudents();
    }
  }, [isOpen, classId, token]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-600" />
              Students in {classTitle}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-gray-600 mb-4">
            Total enrolled students: {students.length}
          </Dialog.Description>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students enrolled yet.
              </div>
            ) : (
              students.map((student, index) => (
                <motion.div
                  key={student.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {student.profilePicture ? (
                    <img
                      src={`http://localhost:8080${student.profilePicture}`}
                      alt={student.username}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm ${student.profilePicture ? 'hidden' : ''}`}
                  >
                    {student.username ? student.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{student.username || 'Unknown'}</p>
                    <p className="text-sm text-gray-600 truncate">{student.email || ''}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-6 text-right pt-4 border-t border-gray-200">
            <Dialog.Close asChild>
              <button className="btn-secondary">Close</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default StudentListPopup;


