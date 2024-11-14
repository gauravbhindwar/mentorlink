import React from 'react'
// import DashboardLayout from '@/components/DashboardLayout/DashboardLayout'
import MentorDashBoard from '../../../components/mentor/MentorDashBoard'
import Navbar from '../../../components/subComponents/Navbar';


const page = () => {

    return (
        <>
            <Navbar/>

            <div>
                <MentorDashBoard />
            </div>
        </>


        // <DashboardLayout />
    )
}

export default page