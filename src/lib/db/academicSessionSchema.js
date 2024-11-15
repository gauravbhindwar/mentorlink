
import mongoose from "mongoose";

const academicSessionsSchema = new mongoose.Schema({
    start_year: { type: Number, required: true }, // Start year of the session
    end_year: { type: Number, required: true }, // End year of the session
    semesters: [{
        semester_number: { type: Number, required: true }, // Semester number (1-8)
        start_date: { type: Date, required: true }, // Start date of the semester
        end_date: { type: Date, required: true }, // End date of the semester
        meetings: [{
            meeting_id: {
                type: mongoose.Schema.Types.ObjectId, // Generate ObjectId instead of a string for better MongoDB practices
                auto: true
            },
            mentor_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Mentor',
                required: true
            },
            mentee_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Mentee',
                required: true
            },
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
                NotesToStudent: { type: String },
                feedbackFromMentee: { type: String },
                feedbackFromMentor: { type: String },
                outcome: { type: String },
                closureRemarks: { type: String }
            },
            created_at: { type: Date, default: Date.now },
            updated_at: { type: Date, default: Date.now }
        }]
    }],
    created_at: { type: Date, default: Date.now }, // Creation date of the session
    updated_at: { type: Date, default: Date.now } // Last updated date
});

const AcademicSession = mongoose.models.AcademicSession || mongoose.model('AcademicSession', academicSessionsSchema);

export { AcademicSession };