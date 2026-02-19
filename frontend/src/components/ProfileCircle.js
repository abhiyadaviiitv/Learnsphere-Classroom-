import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle2, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileEditModal from './ProfileEditModal';

const ProfileCircle = () => {
  const { user, username, profilePicture } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left group mb-2"
      >
        {profilePicture ? (
          <img
            src={`http://localhost:8080${profilePicture}`}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 ${profilePicture ? 'hidden' : ''}`}
        >
          {getInitials(username)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{username || 'Guest'}</h3>
          <p className="text-sm text-gray-600">View Profile</p>
        </div>
        <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </motion.button>

      {isModalOpen && (
        <ProfileEditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default ProfileCircle;


