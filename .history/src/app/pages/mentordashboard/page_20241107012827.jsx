import React from 'react'
// import DashboardLayout from '@/components/DashboardLayout/DashboardLayout'
import MentorDashBoard from '../../../components/mentor/MentorDashBoard'
import Navbar from '../../../components/subComponents/Navbar';


const page = () => {

    return (
        <>
            <Navbar className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-14" />

            <div className="pt-20 px-4 sm:px-8 md:px-10 lg:px-20">

                <MentorDashBoard />
            </div>
        </>


        // <DashboardLayout />
    )
}

export default page