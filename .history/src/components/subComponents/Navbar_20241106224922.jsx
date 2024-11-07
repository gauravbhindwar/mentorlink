"use client"
import React, { useState } from 'react'
import Image from 'next/image'
// import { Button } from '@/components/ui/button'

const Navbar = () => {
    const [dropdownVisible, setDropdownVisible] = useState(false)

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible)
        setReportdropdownVisible(false);
    }
    const [reportdropdownVisible, setReportdropdownVisible] = useState(false)

    const toggleReportDropdown = () => {
        setReportdropdownVisible(!reportdropdownVisible)
    }
    return (
        <>
            <nav className="fixed top-0 z-50 w-full bg-white border-b max-h-[56px] min-h-[56px] border-gray-200 dark:bg-gray-800 dark:border-gray-700" >
                <div className="px-3 py-3 lg:px-5 lg:pl-3">
                    <div className="flex items-center justify-between">

                        {/* Left Logo */}

                        <div className="flex items-center">
                            <Image src="/muj-logo.svg" alt="MUJ Logo" className="h-8 w-auto" width={32} height={32} />
                            {/* <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">MUJ</span> */}
                        </div>

                        {/* Middle Section */}

                        <div>
                            <div onClick={toggleReportDropdown} className="flex items-center space-x-4">
                                <button onClick={toggleReportDropdown} className="flex items-center text-gray-800 dark:text-white focus:outline-none">
                                    <span className="ml-2">Super</span>
                                </button>
                            </div>
                            {reportdropdownVisible && (
                                <div className="absolute  mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700">
                                    <a href="/report" className="block px-4 py-2 text-sm text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Student Report</a>
                                </div>
                            )}
                        </div>

                        {/* Right Section */}

                        <div className="flex items-center space-x-4">
                            <Image src="/sdc-logo.jpg" alt="SDC Logo" className="h-8 w-auto" width={32} height={32} />
                            {/* <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">SDC</span> */}
                            <div className="relative">
                                <button onClick={toggleDropdown} className="flex items-center text-gray-800 dark:text-white focus:outline-none">
                                    {/* <Image src="/path/to/profile-pic.jpg" alt="Profile" className="h-8 w-8 rounded-full" width={32} height={32} /> */}
                                    <span className="ml-2">Profile</span>
                                </button>
                                {/* Dropdown Menu */}
                                {dropdownVisible && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700">
                                        <a href="/profile" className="block px-4 py-2 text-sm text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Profile</a>
                                        <a href="/settings" className="block px-4 py-2 text-sm text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Settings</a>
                                        <a href="/logout" className="block px-4 py-2 text-sm text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Logout</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default Navbar