import React from 'react'
// import DashboardLayout from '@/components/DashboardLayout/DashboardLayout'
import MentorDashBoard from '../../../components/mentor/MentorDashBoard'
import Navbar from '../../../components/subComponents/Navbar';


const page = () => {

    return (
        <>
            <Navbar className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-14" />
            <div className="pt-20 px-4 sm:px-8 md:px-10 lg:px-20">
                <div className="relative flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-4xl mx-auto">
                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <MentorDashBoard />
                    </div>
                </div>
            </div>
        </>


        // <DashboardLayout />
    )
}

export default page