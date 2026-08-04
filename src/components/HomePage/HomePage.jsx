"use client";
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '@/components/Login/Login';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSignOutAlt, FaTimes, FaUser } from 'react-icons/fa';

const HomePage = () => {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if user is already signed in
    const role = sessionStorage.getItem('userRole');
    const name = sessionStorage.getItem('userName') || sessionStorage.getItem('mentorData')?.name;

    if (role) {
      setUserRole(role);
      setUserName(name || 'User');
      setShowLogoutModal(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Call the logout API endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Clear client-side storage
      sessionStorage.clear();
      localStorage.clear();

      // Close modal and stay on login page
      setShowLogoutModal(false);
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback to client-side logout
      sessionStorage.clear();
      localStorage.clear();
      setShowLogoutModal(false);
    }
  };

  const handleStayLoggedIn = () => {
    // Redirect to appropriate dashboard based on role
    // Prioritize mentor dashboard for users with admin rights
    const userRoles = JSON.parse(sessionStorage.getItem('userRoles') || '[]');
    
    if (userRoles.includes('mentor')) {
      router.push('/pages/mentordashboard');
    } else if (userRoles.includes('admin')) {
      router.push('/pages/admin/admindashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src='/MUJ-homeCover.jpg'
          alt='MUJ Campus'
          fill
          className='object-cover opacity-20 mix-blend-overlay'
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 animate-gradient" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex justify-center items-center min-h-screen">
        <Login />
      </div>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-orange-500/20 p-8 max-w-md mx-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowLogoutModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full">
                  <FaUser className="text-2xl text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">Already Signed In</h3>
                <p className="text-gray-300 text-sm mb-4">
                  You are currently signed in as <span className="text-orange-400 font-medium">{userName}</span> with {userRole} access.
                </p>
                <p className="text-gray-400 text-sm">
                  Would you like to log out and sign in with a different account?
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleStayLoggedIn}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200"
                >
                  Stay Logged In
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 px-4 bg-gray-700/50 text-gray-300 rounded-lg font-medium hover:bg-gray-600/50 hover:text-white transition-all duration-200 border border-gray-600"
                >
                  <FaSignOutAlt className="inline mr-2" />
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;

