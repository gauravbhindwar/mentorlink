import React from 'react'
import Navbar from '../../../../components/subComponents/Navbar';
import AdminDashboard from '../../../../components/AdminDash/AdminDashboard';

const page = () => {
  return (
    <>
    <Navbar/>
    <div> 
    <AdminDashboard/>
    </div>
    </>
  )
}

export default page