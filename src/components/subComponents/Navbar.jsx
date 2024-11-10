"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CgMenuRound, CgCloseO } from 'react-icons/cg'

const Navbar = () => {
    const [dropdownVisible, setDropdownVisible] = useState(false)
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('')
    const [localRole, setLocalRole] = useState('')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const router = useRouter()
    let hideDropdownTimeout;

    useEffect(() => {
        const storedRole = sessionStorage.getItem('role');
        const storedEmail = sessionStorage.getItem('email');
        
        if (storedEmail) setEmail(storedEmail);
        if (storedRole) {
            setLocalRole(storedRole);
            setRole(storedRole);
        }
    }, [])

    const handleLogout = () => {
        sessionStorage.clear();
        setRole('');
        setLocalRole('');
        setEmail('');
        router.push('/');
    }

    const handleLogin = () => {
        sessionStorage.clear();
        router.push('/')
    }

    const handleDashboard = () => {
        if (role === 'admin' || role === 'superadmin') {
            router.push('/pages/admindashboard')
        } else if (role === 'mentor') {
            router.push('/pages/mentordashboard')
        } else if (role === 'mentee') {
            router.push('/pages/menteedashboard')
        } else {
            router.push('/dashboard') // Default dashboard
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

    return (
        <>
            <nav className="fixed top-0 z-50 w-full bg-gray-800 border-b border-gray-700 shadow-lg">
                <div className="px-4 md:px-5 py-3 flex items-center justify-between">
                    {/* Left Logo */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-1 rounded-full">
                            <Image src="/muj-logo.svg" alt="MUJ Logo" className="h-6 w-auto md:h-8 hover:scale-105 transition-transform filter invert" width={32} height={32} priority />
                        </div>
                        <Image src="/sdc-logo.jpg" alt="SDC Logo" className="h-6 w-auto md:h-8 hover:scale-105 transition-transform" width={32} height={32} priority />
                        {role && (  // Only show button if role exists
                            <button
                                className="hidden md:block ml-4 text-white bg-orange-700 hover:bg-orange-800 px-6 py-2 rounded-full font-semibold shadow-md transition-all duration-300 hover:scale-105"
                                onClick={handleDashboard}
                            >
                                {role === 'admin' || role === 'superadmin' ? 'Admin Dashboard' : `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`}
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white p-2"
                        onClick={toggleMobileMenu}
                    >
                        {isMobileMenuOpen ? <CgCloseO /> : <CgMenuRound />}
                    </button>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4 relative">
                        {email && role ? (
                            <>
                                <span className="text-white">
                                    {email} ({role})
                                </span>
                                <div
                                    className="relative"
                                    onMouseEnter={showDropdown}
                                    onMouseLeave={hideDropdown}
                                >
                                    <button className="text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-all duration-300">
                                        {role === 'admin' || role === 'superadmin' ? 'Admin Profile' : `${role.charAt(0).toUpperCase() + role.slice(1)} Profile`}
                                    </button>
                                    {dropdownVisible && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-orange-200 overflow-hidden">
                                            <ul className="text-gray-700 dark:text-white">
                                                {role === 'admin' && (
                                                    <>
                                                        <li>
                                                            <button
                                                                className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer"
                                                                onClick={() => router.push('/pages/manageusers')}
                                                            >
                                                                Manage Users
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer"
                                                                onClick={() => router.push('/pages/settings')}
                                                            >
                                                                Settings
                                                            </button>
                                                        </li>
                                                    </>
                                                )}
                                                {role === 'superadmin' && (
                                                    <>
                                                        <li>
                                                            <button
                                                                className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer"
                                                                onClick={() => router.push('/pages/logs')}
                                                            >
                                                                View Logs
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer"
                                                                onClick={() => router.push('/pages/settings')}
                                                            >
                                                                System Settings
                                                            </button>
                                                        </li>
                                                    </>
                                                )}
                                                {role === 'mentor' && (
                                                    <>
                                                        <li>
                                                            <button
                                                                className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer"
                                                                onClick={() => router.push('/pages/managermentees')}
                                                            >
                                                                Manage Mentees
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer"
                                                                onClick={() => router.push('/pages/schedulemeetings')}
                                                            >
                                                                Schedule Meetings
                                                            </button>
                                                        </li>
                                                    </>
                                                )}
                                                {role === 'mentee' && (
                                                    <>
                                                        <li>
                                                            <button
                                                                className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer"
                                                                onClick={() => router.push('/pages/viewmentor')}
                                                            >
                                                                View Mentor
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer"
                                                                onClick={() => router.push('/pages/trackprogress')}
                                                            >
                                                                Track Progress
                                                            </button>
                                                        </li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="text-white bg-red-500 hover:bg-red-600 px-6 py-2 rounded-full font-semibold shadow-md transition-all duration-300 hover:scale-105"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button
                                className="text-white bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full font-semibold shadow-md transition-all duration-300 hover:scale-105"
                                onClick={handleLogin}
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-gray-800 shadow-lg">
                        {email && role ? (
                            <>
                                <div className="text-white px-4 py-2">
                                    {email} ({role})
                                </div>
                                <button
                                    className="w-full text-left text-white px-4 py-3 hover:bg-gray-700 transition-colors"
                                    onClick={handleDashboard}
                                >
                                    Dashboard
                                </button>
                                <button
                                    className="w-full text-left text-white px-4 py-3 hover:bg-gray-700 transition-colors"
                                    onClick={() => router.push('/pages/manageusers')}
                                >
                                    Manage Users
                                </button>
                                <button
                                    className="w-full text-left text-white px-4 py-3 hover:bg-gray-700 transition-colors"
                                    onClick={() => router.push('/pages/settings')}
                                >
                                    Settings
                                </button>
                            </>
                        ) : (
                            <button
                                className="w-full text-left text-white px-4 py-3 hover:bg-gray-700 transition-colors"
                                onClick={handleLogin}
                            >
                                Login
                            </button>
                        )}
                        <button
                            className="w-full text-left text-white px-4 py-3 hover:bg-gray-700 transition-colors"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </nav>
        </>
    )
}

export default Navbar

