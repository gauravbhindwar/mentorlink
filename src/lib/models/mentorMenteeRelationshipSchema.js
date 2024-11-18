import mongoose from "mongoose";

const mentorMenteeRelationshipSchema = new mongoose.Schema({
    mentor_MUJid: { type: String, required: true },
    mentee_MUJid: { type: String, required: true },
    academicYear: { type: String, required: true },
    academicSession: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    session: { type: String, required: true }, // Ensure session field is defined
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const MentorMenteeRelationship = mongoose.models.MentorMenteeRelationship || 
    mongoose.model("MentorMenteeRelationship", mentorMenteeRelationshipSchema);

export { MentorMenteeRelationship };