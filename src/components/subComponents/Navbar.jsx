"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CgMenuRound, CgCloseO } from "react-icons/cg";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  // const [dropdownVisible, setDropdownVisible] = useState(false)
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  let hideDropdownTimeout;

  const buttonVariants = {
    idle: { scale: 1 },
    hover: {
      scale: 1.05,
      boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)",
      transition: {
        duration: 0.3,
        yoyo: Infinity,
      },
    },
  };

  useEffect(() => {
    const storedRole = sessionStorage.getItem("role");
    const storedEmail = sessionStorage.getItem("email");

    if (storedEmail) setEmail(storedEmail);
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      // Close mobile menu when clicking outside
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    // Add click event listener to document
    document.addEventListener("click", handleClickOutside);

    // Cleanup function
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMobileMenuOpen]); // Dependencies array

  const handleLogout = () => {
    sessionStorage.clear();
    setRole("");
    setEmail("");
    router.push("/");
  };

  const handleDashboard = () => {
    if (role === "admin" || role === "superadmin") {
      router.push("/pages/admin/admindashboard");
    } else if (role === "mentor") {
      router.push("/pages/mentordashboard");
    } else if (role === "mentee") {
      router.push("/pages/menteedashboard");
    } else {
      router.push("/"); // Default dashboard
    }
  };

  const showDropdown = () => {
    clearTimeout(hideDropdownTimeout);
    // setDropdownVisible(true);
  };
  const hideDropdown = () => {
    hideDropdownTimeout = setTimeout(() => {
      // setDropdownVisible(false);
    }, 300); // Adjust the delay as needed
  };

  const toggleMobileMenu = (e) => {
    e.stopPropagation(); // Prevent the click from bubbling up
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleAboutUs = () => {
    router.push("/about");
  };

  return (
    <nav className=' rounded-lg fixed top-0 z-50 h-15 w-full bg-gradient-to-r from-orange-500/10 via-orange-400/10 to-pink-500/10 backdrop-blur-md border-b border-orange-200/20 flex justify-center'>
      <div className='px-4 md:px-6 py-3 flex items-center justify-between w-full'>
        {/* Left Logo Section */}
        <div className='flex items-center gap-3'>
          <motion.div
            className='flex items-center gap-2'
            variants={{
              hidden: { opacity: 0, x: -20 },
              show: { opacity: 1, x: 0 },
            }}
            initial='hidden'
            animate='show'
            transition={{ duration: 0.3 }}>
            <motion.div
              whileHover={{
                scale: 1.05,
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.25)",
              }}
              whileTap={{ scale: 0.95 }}
              className='relative bg-[#fa8634] rounded-md px-5 py-2 transition-all duration-200 ease-in-out'>
              <Image
                src='/muj-logo.svg'
                alt='MUJ Logo'
                className='h-8 w-auto filter'
                width={32}
                height={32}
                priority
                quality={100}
              />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className='relative bg-white/5 p-1.5 rounded-xl backdrop-blur-md shadow-md px-4 py-2 transition-all duration-200 ease-in-out'>
              <Image
                src='/sdc-logo-black.webp'
                alt='SDC Logo'
                className='h-8 w-auto filter drop-shadow-lg'
                width={100}
                height={32}
                priority
                quality={100}
                unoptimized={true}
              />
            </motion.div>
          </motion.div>

          {role && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='hidden md:flex items-center text-sm px-3 py-1.5 rounded-lg
                             bg-orange-500/10 hover:bg-orange-500/20
                             border border-orange-200/20 hover:border-orange-200/40
                             text-white/90 font-medium transition-all duration-300'
              onClick={handleDashboard}>
              {role === "admin" || role === "superadmin"
                ? "Admin Dashboard"
                : `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`}
            </motion.button>
          )}
        </div>
        {/* Desktop Menu */}
        <motion.div
          className='hidden md:flex items-center gap-3'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}>
          {email && role ? (
            <>
              <span className='text-sm max-lg:hidden text-white/70 px-3 py-1.5 rounded-lg bg-orange-500/10'>
                {email}
              </span>
              <div
                className='relative'
                onMouseEnter={showDropdown}
                onMouseLeave={hideDropdown}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='text-sm px-3 py-1.5 rounded-lg text-white/90
                                             bg-orange-500/10 hover:bg-orange-500/20
                                             border border-orange-200/20 hover:border-orange-200/40
                                             transition-all duration-300'>
                  Profile
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className='text-sm px-3 py-1.5 rounded-lg text-white/90
                                         bg-red-500/10 hover:bg-red-500/20
                                         border border-red-500/20 hover:border-red-500/30
                                         transition-all duration-300'>
                Logout
              </motion.button>
            </>
          ) : (
            <motion.button
              variants={buttonVariants}
              initial='idle'
              whileHover='hover'
              whileTap={{ scale: 0.95 }}
              onClick={handleAboutUs}
              className='text-sm px-4 py-2 rounded-lg text-emerald-50
                                     bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20
                                     hover:from-green-500/30 hover:via-emerald-500/30 hover:to-teal-500/30
                                     border border-green-400/30
                                     transition-all duration-300
                                     relative overflow-hidden
                                     group'>
              <span className='relative z-10'>About Us</span>
              <motion.div
                className='absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-20
                                         transition-opacity duration-300'
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.button>
          )}
        </motion.div>
        {/* Mobile Menu Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className='md:hidden text-white/90 p-1.5 hover:bg-orange-500/10 rounded-lg
                             border border-orange-200/20'
          onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? (
            <CgCloseO className='w-5 h-5' />
          ) : (
            <CgMenuRound className='w-5 h-5' />
          )}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className='md:hidden absolute top-full left-0 right-0 
                                 bg-gradient-to-b from-gray-900/95 to-gray-800/95
                                 border-t border-orange-200/20 backdrop-blur-md
                                 shadow-xl'>
            <div className='p-4 space-y-3'>
              {email && role && (
                <>
                  <div
                    className='px-4 py-3 rounded-lg bg-gray-800/80 
                                                  border border-orange-200/20'>
                    <p className='text-xs text-orange-200/70'>Signed in as:</p>
                    <p className='truncate text-white font-medium'>{email}</p>
                  </div>
                  <button
                    className='w-full px-4 py-3 rounded-lg
                                                 bg-gradient-to-r from-orange-500/20 to-pink-500/20
                                                 hover:from-orange-500/30 hover:to-pink-500/30
                                                 border border-orange-200/30
                                                 transition-all duration-300
                                                 text-left group'
                    onClick={handleDashboard}>
                    <div className='flex items-center justify-between'>
                      <span className='text-white font-medium'>Dashboard</span>
                      <span className='text-orange-300 transform group-hover:translate-x-1 transition-transform'>
                        →
                      </span>
                    </div>
                  </button>
                  <button
                    className='w-full px-4 py-3 rounded-lg
                                                 bg-gradient-to-r from-red-500/20 to-red-600/20
                                                 hover:from-red-500/30 hover:to-red-600/30
                                                 border border-red-200/30
                                                 transition-all duration-300
                                                 text-left group'
                    onClick={handleLogout}>
                    <div className='flex items-center justify-between'>
                      <span className='text-white font-medium'>Logout</span>
                      <span className='text-red-300 transform group-hover:translate-x-1 transition-transform'>
                        →
                      </span>
                    </div>
                  </button>
                </>
              )}
              {!email && !role && (
                <motion.button
                  variants={buttonVariants}
                  initial='idle'
                  whileHover='hover'
                  whileTap={{ scale: 0.95 }}
                  className='w-full px-4 py-3 rounded-lg
                                             bg-gradient-to-r from-emerald-500/20 to-teal-500/20
                                             hover:from-emerald-500/30 hover:to-teal-500/30
                                             border border-emerald-400/30
                                             transition-all duration-300
                                             relative overflow-hidden
                                             group text-left'
                  onClick={handleAboutUs}>
                  <div className='flex items-center justify-between'>
                    <span className='text-white font-medium relative z-10'>
                      About Us
                    </span>
                    <span className='text-emerald-300 relative z-10 transform group-hover:translate-x-1 transition-transform'>
                      →
                    </span>
                  </div>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
