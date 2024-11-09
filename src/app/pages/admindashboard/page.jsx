import React from 'react'
import AdminDashboard from '../../../components/AdminDash/AdminDashboard'
import Navbar from '../../../components/subComponents/Navbar';

const page = () => {
  return (
    <>
    <Navbar/>
    <div className="pt-20 px-4 sm:px-8 md:px-10 lg:px-20">
     
    <AdminDashboard  />
    </div>
    </>
  )
}

export default page