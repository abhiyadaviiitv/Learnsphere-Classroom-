import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, UserCircle2, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ProfileEditModal = ({ isOpen, onClose }) => {
  const { user, username, profilePicture, setAuthToken, setUser } = useAuth();
  const [newUsername, setNewUsername] = useState(username || '');
  const [newProfilePicture, setNewProfilePicture] = useState(profilePicture || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setNewUsername(username || '');
    setNewProfilePicture(profilePicture || '');
    setError('');
    setSuccess('');
    setSelectedFile(null);
  }, [isOpen, username, profilePicture]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size too large. Please upload an image smaller than 5MB.");
        return;
      }
      setSelectedFile(file);
      setNewProfilePicture(URL.createObjectURL(file)); // Show preview
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('username', newUsername);
      if (selectedFile) {
        formData.append('profilePicture', selectedFile);
      }

      const token = localStorage.getItem('token');

      // NOTE: Do not manually set Content-Type to multipart/form-data when using axios with FormData
      // Axios will automatically set it with the correct boundary
      const response = await axios.put(
        `http://localhost:8080/api/profile/update`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Update auth context and local storage
      const updatedUser = response.data;
      setUser(updatedUser); // Update user object in context
      localStorage.setItem('username', updatedUser.username);
      if (updatedUser.profilePicture) {
        localStorage.setItem('profilePicture', updatedUser.profilePicture);
      }

      setSuccess('Profile updated successfully!');
      setTimeout(onClose, 1500); // Close modal after a short delay
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
              <UserCircle2 className="w-6 h-6 text-primary-600" />
              Edit Profile
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-gray-600 mb-6">
            Update your username and profile picture.
          </Dialog.Description>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-success-50 border border-success-200 text-success-700 rounded-lg text-sm"
            >
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center">
              {newProfilePicture ? (
                <img
                  src={newProfilePicture.startsWith('blob:') ? newProfilePicture : `http://localhost:8080${newProfilePicture}`}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-primary-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    // e.target.nextSibling.style.display = 'flex'; // This might fail if nextSibling is not the div
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-4xl font-semibold mb-4">
                  {getInitials(newUsername)}
                </div>
              )}
              <label htmlFor="profile-picture-upload" className="btn-secondary cursor-pointer flex items-center gap-2">
                <UploadCloud className="w-5 h-5" />
                Upload Photo
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="input-field w-full"
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Dialog.Close asChild>
                <button type="button" className="btn-ghost flex-1">Cancel</button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ProfileEditModal;
