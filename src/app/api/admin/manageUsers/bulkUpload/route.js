import { connect } from "../../../../../lib/dbConfig";
import { Mentee } from "../../../../../lib/db/menteeSchema";
import { Mentor } from "../../../../../lib/db/mentorSchema";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await connect();
        const body = await req.json();
        const { data: uploadData, type } = body;

        // Basic validation
        if (!type || !['mentor', 'mentee'].includes(type)) {
            return NextResponse.json({ error: "Invalid user type specified" }, { status: 400 });
        }

        if (!Array.isArray(uploadData) || uploadData.length === 0) {
            return NextResponse.json({ error: "No valid data provided" }, { status: 400 });
        }

        if (type === 'mentor') {
            // Validate and sanitize each record first
            const validatedRecords = uploadData
                .filter(mentor => mentor && typeof mentor === 'object') // Filter out null/undefined records
                .map(mentor => ({
                    ...mentor,
                    email: mentor.email?.toLowerCase().trim() || null,
                    MUJid: mentor.MUJid?.toUpperCase().trim() || null,
                    name: mentor.name?.trim() || null,
                    phone_number: mentor.phone_number?.toString().replace(/\D/g, '') || null,
                    academicYear: mentor.academicYear?.trim() || null,
                    academicSession: mentor.academicSession?.trim() || null
                }));

            // Early validation to prevent null values
            const errors = [];
            validatedRecords.forEach((mentor, index) => {
                const recordErrors = [];
                
                if (!mentor.email) {
                    recordErrors.push('Email is required');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mentor.email)) {
                    recordErrors.push('Invalid email format');
                }

                if (!mentor.MUJid) {
                    recordErrors.push('MUJid is required');
                } else if (!/^[A-Z0-9]+$/.test(mentor.MUJid)) {
                    recordErrors.push('Invalid MUJid format');
                }

                if (!mentor.phone_number || !/^\d{10}$/.test(mentor.phone_number)) {
                    recordErrors.push('Invalid phone number (must be 10 digits)');
                }
                if (!mentor.name) {
                    recordErrors.push('Name is required');
                }
                if (!mentor.academicYear || !/^\d{4}-\d{4}$/.test(mentor.academicYear)) {
                    recordErrors.push('Invalid academic year format');
                }
                if (!mentor.academicSession || !/(JULY-DECEMBER|JANUARY-JUNE)/.test(mentor.academicSession.split(' ')[0].toUpperCase())) {
                    recordErrors.push('Invalid academic session format');
                }

                if (recordErrors.length > 0) {
                    errors.push({
                        row: index + 1,
                        MUJid: mentor.MUJid || 'Unknown',
                        errors: recordErrors
                    });
                }
            });

            if (errors.length > 0) {
                return NextResponse.json({
                    message: "Validation errors in records",
                    errors
                }, { status: 400 });
            }

            try {
                const cleanRecords = validatedRecords.filter(mentor => 
                    mentor.email && 
                    mentor.MUJid && 
                    mentor.name && 
                    mentor.academicYear && 
                    mentor.academicSession
                );

                // Group mentors by academic year and session
                const groupedMentors = cleanRecords.reduce((acc, mentor) => {
                    const key = `${mentor.academicYear}_${mentor.academicSession.split(' ')[0].toUpperCase()}`;
                    if (!acc[key]) {
                        acc[key] = {
                            academicYear: mentor.academicYear,
                            sessionName: mentor.academicSession.split(' ')[0].toUpperCase(),
                            mentors: []
                        };
                    }
                    acc[key].mentors.push({
                        name: mentor.name,
                        email: mentor.email,
                        MUJid: mentor.MUJid,
                        phone_number: mentor.phone_number,
                        role: ['mentor'],
                        gender: mentor.gender?.toLowerCase() || '',
                        auth: {
                            isVerified: false,
                            isOtpUsed: false
                        }
                    });
                    return acc;
                }, {});

                // Process each group separately
                for (const group of Object.values(groupedMentors)) {
                    // Check if record exists for this academic year and session
                    const existingRecord = await Mentor.findOne({
                        'academicRecords.academicYear': group.academicYear,
                        'academicRecords.sessions.sessionName': group.sessionName
                    });

                    if (existingRecord) {
                        // Record exists, update the mentorInfo array
                        const academicRecordIndex = existingRecord.academicRecords.findIndex(
                            record => record.academicYear === group.academicYear
                        );

                        if (academicRecordIndex > -1) {
                            const sessionIndex = existingRecord.academicRecords[academicRecordIndex].sessions.findIndex(
                                session => session.sessionName === group.sessionName
                            );

                            if (sessionIndex > -1) {
                                // Session exists, append new mentors
                                await Mentor.updateOne(
                                    {
                                        'academicRecords.academicYear': group.academicYear,
                                        'academicRecords.sessions.sessionName': group.sessionName
                                    },
                                    {
                                        $push: {
                                            [`academicRecords.${academicRecordIndex}.sessions.${sessionIndex}.mentorInfo`]: {
                                                $each: group.mentors
                                            }
                                        }
                                    }
                                );
                            } else {
                                // Add new session
                                await Mentor.updateOne(
                                    { 'academicRecords.academicYear': group.academicYear },
                                    {
                                        $push: {
                                            [`academicRecords.${academicRecordIndex}.sessions`]: {
                                                sessionName: group.sessionName,
                                                mentorInfo: group.mentors
                                            }
                                        }
                                    }
                                );
                            }
                        } else {
                            // Add new academic record
                            await Mentor.updateOne(
                                { _id: existingRecord._id },
                                {
                                    $push: {
                                        academicRecords: {
                                            academicYear: group.academicYear,
                                            sessions: [{
                                                sessionName: group.sessionName,
                                                mentorInfo: group.mentors
                                            }]
                                        }
                                    }
                                }
                            );
                        }
                    } else {
                        // Create new record
                        await Mentor.create({
                            academicRecords: [{
                                academicYear: group.academicYear,
                                sessions: [{
                                    sessionName: group.sessionName,
                                    mentorInfo: group.mentors
                                }]
                            }]
                        });
                    }
                }

                return NextResponse.json({
                    message: "Bulk upload completed successfully",
                    savedCount: Object.values(groupedMentors).reduce(
                        (acc, group) => acc + group.mentors.length, 
                        0
                    )
                }, { status: 201 });

            } catch (error) {
                console.error('Bulk upload error:', error);
                return NextResponse.json({
                    message: "Error during bulk upload",
                    error: error.message
                }, { status: 400 });
            }
        }

        // ...existing code for mentee type...
    } catch (error) {
        console.error("Error in bulk upload:", error);
        return NextResponse.json({ error: "Error processing bulk upload" }, { status: 500 });
    }
}