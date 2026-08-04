"use client";
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const ManageMeeting = dynamic(
  () => import("@/components/AdminDash/Meetings/ManageMeeting"),
  { ssr: false }
);

const ManageMeetingPage = () => {
  return (
    <ManageMeeting />
  );
};

export default ManageMeetingPage;
