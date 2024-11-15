
import mongoose from "mongoose";

const mentorMenteeRelationshipSchema = new mongoose.Schema({
    mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', required: true }, // Reference to the mentor
    mentee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentee', required: true }, // Reference to the mentee
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true }, // Reference to the academic session
    current_semester: { type: Number, required: true }, // Current semester of the mentee (1-8)
    section: { type: String, required: true, enum: ['A', 'B', 'C', 'D', 'E'] }, // Section of the mentee
    completed_meetings: [{
        meeting_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession.semesters.meetings', required: true }, // Reference to completed meeting
        meeting_date: { type: Date, required: true } // Date when the meeting was completed
    }], // Array of completed meetings
    created_at: { type: Date, default: Date.now }, // Date when the relationship was created
    updated_at: { type: Date, default: Date.now } // Date when the relationship was updated
});

const MentorMenteeRelationship = mongoose.models.MentorMenteeRelationship || mongoose.model("MentorMenteeRelationship", mentorMenteeRelationshipSchema);

export { MentorMenteeRelationship };