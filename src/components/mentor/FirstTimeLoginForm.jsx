"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion';
// import { signIn } from 'next-auth/react';

const FirstTimeLoginForm = ({ onSubmitSuccess, mentorData }) => {
    const [formData, setFormData] = useState({
        name: mentorData?.name || '',
        MUJid: mentorData?.MUJid || '',
        phone_number: mentorData?.phone_number || '',
        address: mentorData?.address || '',
        gender: mentorData?.gender || '',
        academicYear: mentorData?.academicYear || '',
        academicSession: mentorData?.academicSession || '',
    });

    // console.log("Mentor Data:", mentorData);

    const [errors, setErrors] = useState({});

    const getSessionOptions = () => {
        if (!formData.academicYear) return [];
        const [startYear, endYear] = formData.academicYear.split('-');
        return [`JULY-DECEMBER ${startYear}`, `JANUARY-JUNE ${endYear}`];
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Required fields validation
        if (!/^[A-Za-z\s]{2,50}$/.test(formData.name)) {
            newErrors.name = 'Name should only contain letters and be 2-50 characters long';
        }

        if (!/^[A-Z0-9]{5,10}$/.test(formData.MUJid)) {
            newErrors.MUJid = 'MUJid should be 5-10 characters long and contain only uppercase letters and numbers';
        }

        // Optional fields validation (only if they have values)
        if (formData.phone_number && !/^\d{10}$/.test(formData.phone_number)) {
            newErrors.phone_number = 'Please enter a valid 10-digit phone number';
        }

        if (formData.address && formData.address.length < 5) {
            newErrors.address = 'Address should be at least 5 characters long';
        }

        if (formData.gender && !['male', 'female', 'other'].includes(formData.gender)) {
            newErrors.gender = 'Please select a valid gender';
        }

        if (formData.academicYear && !/^\d{4}-\d{4}$/.test(formData.academicYear)) {
            newErrors.academicYear = 'Academic Year should be in format YYYY-YYYY';
        }

        if (formData.academicSession && !getSessionOptions().includes(formData.academicSession)) {
            newErrors.academicSession = 'Please select a valid academic session';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const extractSessionData = (data) => ({
        name: data.name,
        email: data.email,
        MUJid: data.MUJid,
        academicSession: data.academicSession,
        academicYear: data.academicYear,
        isFirstTimeLogin: data.isFirstTimeLogin
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const updatedData = {
                    ...formData,
                    email: mentorData.email,
                    isFirstTimeLogin: false,
                };

                const response = await fetch('/api/mentor', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData),
                });

                if (response.ok) {
                    const data = await response.json();
                    // console.log('Profile updated successfully:', data);
                    
                    if (mentorData.isFirstTimeLogin) {
                        try {
                            const sessionData = extractSessionData(data);
                            sessionStorage.setItem('mentorData', JSON.stringify(sessionData));
                            // console.log('Session data set:', sessionData);
                        } catch (storageError) {
                            console.error('SessionStorage error:', storageError);
                        }
                    }
                    
                    onSubmitSuccess();
                } else {
                    const error = await response.json();
                    console.error('Error updating profile:', error);
                }
            } catch (error) {
                console.error('Error updating mentor information:', error);
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto p-6 bg-black/30 rounded-lg backdrop-blur-lg border border-white/10"
        >
            <h2 className="text-2xl font-bold text-white mb-6">Complete Your Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Input */}
                <div>
                    <label className="block text-white mb-2">Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value.replace(/[^A-Za-z\s]/g, '')})}
                        className={`w-full p-2 rounded bg-white/10 text-white border ${errors.name ? 'border-red-500' : 'border-white/20'}`}
                        required
                        maxLength={50}
                    />
                    {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                </div>

                {/* MUJid Input */}
                {/* <div>
                    <label className="block text-white mb-2">MUJid</label>
                    <input
                        type="text"
                        value={formData.MUJid}
                        onChange={(e) => setFormData({...formData, MUJid: e.target.value.toUpperCase()})}
                        className={`w-full p-2 rounded bg-white/10 text-white border ${errors.MUJid ? 'border-red-500' : 'border-white/20'}`}
                        required
                        maxLength={10}
                    />
                    {errors.MUJid && <span className="text-red-500 text-sm">{errors.MUJid}</span>}
                </div> */}

                {/* Phone Number Input */}
                <div>
                    <label className="block text-white mb-2">Phone Number</label>
                    <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({...formData, phone_number: e.target.value.replace(/\D/g, '')})}
                        className={`w-full p-2 rounded bg-white/10 text-white border ${errors.phone_number ? 'border-red-500' : 'border-white/20'}`}
                        maxLength={10}
                    />
                    {errors.phone_number && <span className="text-red-500 text-sm">{errors.phone_number}</span>}
                </div>

                {/* Address Input */}
                {/* <div>
                    <label className="block text-white mb-2">Address</label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className={`w-full p-2 rounded bg-white/10 text-white border ${errors.address ? 'border-red-500' : 'border-white/20'}`}
                    />
                    {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
                </div> */}

                {/* Gender Select */}
                <div>
                    <label className="block text-white mb-2">Gender</label>
                    <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className={`w-full p-2 rounded bg-white/10 text-white border ${errors.gender ? 'border-red-500' : 'border-white/20'}`}
                    >
                        <option value="">Select Gender</option>
                        <option className="text-black" value="male">Male</option>
                        <option className="text-black" value="female">Female</option>
                        <option className="text-black" value="other">Other</option>
                    </select>
                    {errors.gender && <span className="text-red-500 text-sm">{errors.gender}</span>}
                </div>

                {/* Academic Year Input */}
                <div>
                    <label className="block text-white mb-2">Academic Year (YYYY-YYYY)</label>
                    <input
                        type="text"
                        value={formData.academicYear}
                        onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                        placeholder={mentorData?.academicYear}
                        disabled={mentorData?.academicYear ? true : false}
                        className={`w-full p-2 rounded bg-white/10 text-white border ${errors.academicYear ? 'border-red-500' : 'border-white/20'} ${mentorData?.academicYear ? 'opacity-60' : ''}`}
                    />
                    {errors.academicYear && <span className="text-red-500 text-sm">{errors.academicYear}</span>}
                </div>

                {/* Academic Session Select */}
                <div>
                    <label className="block text-white mb-2">Academic Session</label>
                    <select
                        value={formData.academicSession}
                        onChange={(e) => setFormData({...formData, academicSession: e.target.value})}
                        className={`w-full p-2 rounded bg-white/10 text-white border ${errors.academicSession ? 'border-red-500' : 'border-white/20'} ${formData.academicYear ? 'opacity-60' : ''}`}
                        disabled={!formData.academicYear}
                    >
                        <option className='text-black' value="">Select Session</option>
                        {getSessionOptions().map((option, index) => (
                            <option key={index} className="text-black" value={option}>{option}</option>
                        ))}
                    </select>
                    {errors.academicSession && <span className="text-red-500 text-sm">{errors.academicSession}</span>}
                </div>

                <button
                    type="submit"
                    className="w-full p-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded hover:opacity-90 transition-opacity"
                >
                    Submit
                </button>
            </form>
        </motion.div>
    );
};

export default FirstTimeLoginForm;
