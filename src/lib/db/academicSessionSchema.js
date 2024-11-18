import mongoose from "mongoose";

const academicSessionsSchema = new mongoose.Schema({
    start_year: { type: Number, required: true }, // Start year of the session
    end_year: { type: Number, required: true }, // End year of the session
    sessions: [{
        name: { 
            type: String, 
            required: true,
            validate: {
                validator: function(v) {
                    return /^(JULY-DECEMBER|JANUARY-JUNE) \d{4}$/.test(v);
                },
                message: 'Session must be JULY-DECEMBER YYYY or JANUARY-JUNE YYYY'
            }
        },
        semesters: [{
            semester_number: { type: Number, required: true }, // Semester number (1-8)
            start_date: { type: Date, required: true }, // Start date of the semester
            end_date: { type: Date, required: true }, // End date of the semester
            sections: [{
                name: { 
                    type: String, 
                    required: true,
                    uppercase: true,
                    validate: {
                        validator: function(v) {
                            return /^[A-F]$/.test(v);
                        },
                        message: 'Section must be a single uppercase letter A-F'
                    }
                },
                meetings: [{
                    meeting_id: {
                        type: mongoose.Schema.Types.ObjectId, // Generate ObjectId instead of a string for better MongoDB practices
                        auto: true
                    },
                    mentor_id: {
                        type: String,
                        ref: 'Mentor',
                        required: true,
                        uppercase: true,
                        validate: {
                            validator: function(v) {
                                return /^[A-Z0-9]+$/.test(v);
                            },
                            message: 'Mentor MUJid must be uppercase alphanumeric only'
                        }
                    },
                    mentee_ids: [{
                        type: String,
                        ref: 'Mentee',
                        required: true,
                        uppercase: true,
                        validate: {
                            validator: function(v) {
                                return /^[A-Z0-9]+$/.test(v);
                            },
                            message: 'Mentee MUJid must be uppercase alphanumeric only'
                        }
                    }],
                    meeting_date: { type: Date, required: true },
                    meeting_time: {
                        type: String,
                        required: true,
                        validate: {
                            validator: function (v) {
                                const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
                                return timeRegex.test(v);
                            },
                            message: 'Invalid time format, please enter time in hh:mm AM/PM format'
                        }
                    },
                    meeting_notes: {
                        TopicOfDiscussion: { type: String },
                        TypeOfInformation: { type: String },
                        NotesToStudent: { type: String },
                        feedbackFromMentee: { type: String },
                        // feedbackFromMentor: { type: String },
                        outcome: { type: String },
                        closureRemarks: { type: String }
                    },
                    created_at: { type: Date, default: Date.now },
                    updated_at: { type: Date, default: Date.now }
                }]
            }]
        }]
    }],
    created_at: { type: Date, default: Date.now }, // Creation date of the session
    updated_at: { type: Date, default: Date.now } // Last updated date
});

// Middleware to enforce `session_id` equals `start_year`
academicSessionsSchema.pre('save', function (next) {
    this.session_id = this.start_year;
    next();
});

academicSessionsSchema.methods.getMentorMeetingCounts = async function () {
    const sessions = await this.model('AcademicSession').aggregate([
        { $unwind: '$semesters' },
        { $unwind: '$semesters.meetings' },
        {
            $group: {
                _id: '$semesters.meetings.mentor_id',
                meetingCount: { $sum: 1 }
            }
        }
    ]);
    return sessions;
};

const AcademicSession = mongoose.models.AcademicSession || mongoose.model('AcademicSession', academicSessionsSchema);

export { AcademicSession };
