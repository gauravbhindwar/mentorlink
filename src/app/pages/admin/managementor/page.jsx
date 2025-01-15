"use client";
import React from 'react'
import dynamic from 'next/dynamic';

const MentorManagement = dynamic(() => import('../../../../components/AdminDash/mentor/MentorManagement'), { ssr: false });

const page = () => {
  return (
    <>
      <MentorManagement />
    </>
  );
};

export default page;