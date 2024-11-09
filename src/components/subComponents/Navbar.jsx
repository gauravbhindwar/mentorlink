"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const Navbar = () => {
    const [dropdownVisible, setDropdownVisible] = useState(false)
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('')
    const [localRole, setLocalRole] = useState('')  // Add this line
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
        setLocalRole('');  // Add this line
        setEmail('');
        router.push('/');
    }

    const handleLogin = () => {
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

    return (
        <>
            <nav className="fixed top-0 z-50 w-full bg-gradient-to-r from-blue-500 to-indigo-500 border-b border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="px-5 py-3 flex items-center justify-between">
                    {/* Left Logo */}
                    <div className="flex items-center">
                        <Image src="/muj-logo.svg" alt="MUJ Logo" className="h-8 w-auto" width={32} height={32} />
                        <Image src="/sdc-logo.jpg" alt="SDC Logo" className="h-8 w-auto" width={32} height={32} />
                        <button
                            className="ml-4 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all duration-300"
                            onClick={handleDashboard}
                        >
                            {role === 'admin' || role === 'superadmin' ? 'Admin Dashboard' : `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`}
                        </button>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-4 relative">
                        {role ? (
                            <>
                                <div
                                    className="relative"
                                    onMouseEnter={showDropdown}
                                    onMouseLeave={hideDropdown}
                                >
                                    <button
                                        className="text-white px-4 py-2 rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
                                    >
                                        {role === 'admin' || role === 'superadmin' ? 'Admin Dashboard' : `${role.charAt(0).toUpperCase() + role.slice(1)} Profile`}
                                    </button>
                                    {dropdownVisible && (
                                        <div
                                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg dark:bg-gray-800 z-50 transition-all duration-300"
                                            onMouseEnter={showDropdown}
                                            onMouseLeave={hideDropdown}
                                        >
                                            <ul className="text-gray-700 dark:text-white">
                                                {role === 'admin' && (
                                                    <>
                                                        <li>
                                                            <button className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer">Manage Users</button>
                                                        </li>
                                                        <li>
                                                            <button className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer">Settings</button>
                                                        </li>
                                                    </>
                                                )}
                                                {role === 'superadmin' && (
                                                    <>
                                                        <li>
                                                            <button className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer">View Logs</button>
                                                        </li>
                                                        <li>
                                                            <button className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer">System Settings</button>
                                                        </li>
                                                    </>
                                                )}
                                                {role === 'mentor' && (
                                                    <>
                                                        <li>
                                                            <button className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer">Manage Mentees</button>
                                                        </li>
                                                        <li>
                                                            <button className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer">Schedule Meetings</button>
                                                        </li>
                                                    </>
                                                )}
                                                {role === 'mentee' && (
                                                    <>
                                                        <li>
                                                            <button className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer">View Mentor</button>
                                                        </li>
                                                        <li>
                                                            <button className="dropdown-item hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 w-full text-left cursor-pointer">Track Progress</button>
                                                        </li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-all duration-300"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-all duration-300"
                                    onClick={handleLogin}
                                >
                                    Login
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>
        </>
    )
}

export default Navbar