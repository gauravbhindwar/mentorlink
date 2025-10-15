"use client";
import React from "react";
// import DashboardLayout from '@/components/DashboardLayout/DashboardLayout'
import dynamic from 'next/dynamic';

// Import the component with no SSR to prevent document is not defined errors
const MentorDashBoard = dynamic(
  () => import("../../../components/mentor/MentorDashBoard"),
  { ssr: false }
);

const Page = () => {
  return (
    <>
      <div>
        <MentorDashBoard />
      </div>
    </>
    // <DashboardLayout />
  );
};

export default Page;
