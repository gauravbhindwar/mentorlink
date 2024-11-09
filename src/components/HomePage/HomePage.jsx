"use client";
import React, { useState } from "react";
import { Button } from "../ui/button";
import Login from "@/components/Login/Login";
import Navbar from "@/components/subComponents/Navbar"; // Import Navbar component
import { motion } from "framer-motion"; // For animations

const HomePage = () => {
  const [loginType, setLoginType] = useState(null);

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Home Page Content */}
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 md:px-8">
        {!loginType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow-lg rounded-xl p-6 md:p-8 space-y-6 w-full max-w-md"
          >
            {/* Mentor Button */}
            <div className="space-y-4">
              <Button
                className="w-full py-2 md:py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg transition-all duration-300 ease-in-out text-sm md:text-base"
                onClick={() => setLoginType("mentor")}
              >
                Mentor Login
              </Button>
            </div>

            {/* Mentee Button */}
            <div className="space-y-4">
              <Button
                className="w-full py-2 md:py-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-teal-500 hover:to-green-500 text-white shadow-lg transition-all duration-300 ease-in-out text-sm md:text-base"
                onClick={() => setLoginType("mentee")}
              >
                Mentee Login
              </Button>
            </div>

            {/* Admin Button */}
            <div className="space-y-4">
              <Button
                className="w-full py-2 md:py-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-blue-600 hover:to-indigo-500 text-white shadow-lg transition-all duration-300 ease-in-out text-sm md:text-base"
                onClick={() => setLoginType("admin")}
              >
                Admin Login
              </Button>
            </div>

            {/* SuperAdmin Button */}
            <div className="space-y-4">
              <Button
                className="w-full py-2 md:py-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white shadow-lg transition-all duration-300 ease-in-out text-sm md:text-base"
                onClick={() => setLoginType("superadmin")}
              >
                SuperAdmin Login
              </Button>
            </div>
          </motion.div>
        )}

        {loginType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            {loginType === "mentor" && <Login role="mentor" />}
            {loginType === "mentee" && <Login role="mentee" />}
            {loginType === "admin" && <Login role="admin" />}
            {loginType === "superadmin" && <Login role="superadmin" />}
          </motion.div>
        )}
      </div>
    </>
  );
};

export default HomePage;
