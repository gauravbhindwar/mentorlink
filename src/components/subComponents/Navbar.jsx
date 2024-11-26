"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CgMenuRound, CgCloseO } from 'react-icons/cg'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
    const [dropdownVisible, setDropdownVisible] = useState(false)
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const router = useRouter()
    let hideDropdownTimeout;

    const buttonVariants = {
        idle: { scale: 1 },
        hover: { 
            scale: 1.05,
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
            transition: {
                duration: 0.3,
                yoyo: Infinity
            }
        }
    };

    useEffect(() => {
        const storedRole = sessionStorage.getItem('role');
        const storedEmail = sessionStorage.getItem('email');
        
        if (storedEmail) setEmail(storedEmail);
        if (storedRole) {
            setRole(storedRole);
        }
    }, [])

    const handleLogout = () => {
        sessionStorage.clear();
        setRole('');
        setEmail('');
        router.push('/');
    }

    const handleDashboard = () => {
        if (role === 'admin' || role === 'superadmin') {
            router.push('/pages/admin/admindashboard')
        } else if (role === 'mentor') {
            router.push('/pages/mentordashboard')
        } else if (role === 'mentee') {
            router.push('/pages/menteedashboard')
        } else {
            router.push('/') // Default dashboard
        }
    }

    const showDropdown = () => {
        clearTimeout(hideDropdownTimeout);
        setDropdownVisible(true);
    }
    const hideDropdown = () => {
        hideDropdownTimeout = setTimeout(() => {
            setDropdownVisible(false);
        }, 300); // Adjust the delay as needed
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    const handleAboutUs = () => {
        router.push('/pages/about');
    }

    return (
        <nav className="fixed top-0 z-50 w-full bg-gradient-to-r from-orange-500/10 via-orange-400/10 to-pink-500/10 backdrop-blur-md border-b border-orange-200/20 flex justify-center">
            <div className="px-4 md:px-6 py-3 flex items-center justify-between w-full">
                {/* Left Logo Section */}
                <div className="flex items-center gap-3">
                    <motion.div
                        className="flex items-center gap-2"
                        variants={{
                            hidden: { opacity: 0, x: -20 },
                            show: { opacity: 1, x: 0 }
                        }}
                        initial="hidden"
                        animate="show"
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative bg-gradient-to-r from-orange-500 to-pink-500 p-1.5 rounded-xl"
                        >
                            <Image 
                                src="/muj-logo.svg" 
                                alt="MUJ Logo" 
                                className="h-8 w-auto filter" 
                                width={32} 
                                height={32} 
                                priority 
                            />
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative bg-white/10 p-1.5 rounded-xl"
                        >
                            <Image 
                                src="/sdc-logo.jpg" 
                                alt="SDC Logo" 
                                className="h-8 w-auto" 
                                width={32} 
                                height={32} 
                                priority 
                            />
                        </motion.div>
                    </motion.div>

                    {role && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="hidden md:flex items-center text-sm px-3 py-1.5 rounded-lg
                                     bg-orange-500/10 hover:bg-orange-500/20
                                     border border-orange-200/20 hover:border-orange-200/40
                                     text-white/90 font-medium transition-all duration-300"
                            onClick={handleDashboard}
                        >
                            {role === 'admin' || role === 'superadmin' 
                                ? 'Admin Dashboard' 
                                : `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`
                            }
                        </motion.button>
                    )}
                </div>

                {/* Desktop Menu */}
                <motion.div 
                    className="hidden md:flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {email && role ? (
                        <>
                            <span className="text-sm max-lg:hidden text-white/70 px-3 py-1.5 rounded-lg bg-orange-500/10">
                                {email}
                            </span>
                            <div className="relative" onMouseEnter={showDropdown} onMouseLeave={hideDropdown}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="text-sm px-3 py-1.5 rounded-lg text-white/90
                                             bg-orange-500/10 hover:bg-orange-500/20
                                             border border-orange-200/20 hover:border-orange-200/40
                                             transition-all duration-300"
                                >
                                    Profile
                                </motion.button>
                                
                                {dropdownVisible && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute right-0 mt-1 w-48 rounded-lg
                                                 bg-gradient-to-b from-orange-500/10 to-pink-500/10
                                                 border border-orange-200/20 backdrop-blur-lg
                                                 shadow-lg overflow-hidden"
                                    >
                                        {/* Existing dropdown content with updated styles */}
                                        <div className="p-1">
                                            {/* Update the classes for each dropdown item */}
                                            {/* Example for one item: */}
                                            <button
                                                className="w-full px-4 py-2.5 text-left text-white/90
                                                         hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-pink-500/20
                                                         rounded-lg transition-all duration-300"
                                                onClick={() => router.push('/pages/settings')}
                                            >
                                                Settings
                                            </button>
                                            {/* <button
                                                className="w-full px-4 py-2.5 text-left text-white/90
                                                         hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-pink-500/20 lg:hidden truncate
                                                         rounded-lg transition-all duration-300"
                                                // onClick={() => router.push('/pages/settings')}
                                            >
                                                {email}
                                            </button> */}
                                            {/* ...other dropdown items... */}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleLogout}
                                className="text-sm px-3 py-1.5 rounded-lg text-white/90
                                         bg-red-500/10 hover:bg-red-500/20
                                         border border-red-500/20 hover:border-red-500/30
                                         transition-all duration-300"
                            >
                                Logout
                            </motion.button>
                        </>
                    ) : (
                        <motion.button
                            variants={buttonVariants}
                            initial="idle"
                            whileHover="hover"
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAboutUs}
                            className="text-sm px-4 py-2 rounded-lg text-emerald-50
                                     bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20
                                     hover:from-green-500/30 hover:via-emerald-500/30 hover:to-teal-500/30
                                     border border-green-400/30
                                     transition-all duration-300
                                     relative overflow-hidden
                                     group"
                        >
                            <span className="relative z-10">About Us</span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-20
                                         transition-opacity duration-300"
                                animate={{
                                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: 'linear'
                                }}
                            />
                        </motion.button>
                    )}
                </motion.div>

                {/* Mobile Menu Button */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="md:hidden text-white/90 p-1.5 hover:bg-orange-500/10 rounded-lg
                             border border-orange-200/20"
                    onClick={toggleMobileMenu}
                >
                    {isMobileMenuOpen ? 
                        <CgCloseO className="w-5 h-5" /> : 
                        <CgMenuRound className="w-5 h-5" />
                    }
                </motion.button>
            </div>

            {/* Mobile Menu - Revamped */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-gradient-to-b from-orange-500/10 to-pink-500/10
                                 border-t border-orange-200/20 backdrop-blur-md"
                    >
                        <div className="p-2 space-y-1">
                            {email && role && (
                                <div className="px-4 py-3 rounded-lg bg-white/5 text-white/70">
                                    {email}
                                </div>
                            )}
                            {!email && !role && (
                                <motion.button
                                    variants={buttonVariants}
                                    initial="idle"
                                    whileHover="hover"
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full px-4 py-2 rounded-lg text-sm text-emerald-50
                                             bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20
                                             hover:from-green-500/30 hover:via-emerald-500/30 hover:to-teal-500/30
                                             border border-green-400/30
                                             transition-all duration-300
                                             relative overflow-hidden
                                             group text-left"
                                    onClick={handleAboutUs}
                                >
                                    <span className="relative z-10">About Us</span>
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-20
                                                 transition-opacity duration-300"
                                        animate={{
                                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                        }}
                                        transition={{
                                            duration: 5,
                                            repeat: Infinity,
                                            ease: 'linear'
                                        }}
                                    />
                                </motion.button>
                            )}
                            {/* Mobile menu items with consistent styling */}
                            <button
                                className="w-full px-4 py-3 rounded-lg text-white
                                         bg-gradient-to-r from-orange-500/10 to-pink-500/10
                                         hover:from-orange-500/20 hover:to-pink-500/20
                                         border border-white/10
                                         transition-all duration-300 text-left"
                                onClick={handleDashboard}
                            >
                                Dashboard
                            </button>
                            {/* ...other mobile menu items... */}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;

