import mongoose from "mongoose";
import { Mentor } from "./mentorSchema";
import { Mentee } from "./menteeSchema";

const mentorMenteeRelationshipSchema = new mongoose.Schema({
    mentor_MUJid: { type: String, required: true }, // MUJid of the mentor
    mentee_MUJid: { type: String, required: true }, // MUJid of the mentee
    session: { type: String, required: true }, // Required
    current_semester: { type: Number, required: true }, // Required
    section: { type: String, required: true, enum: ['A', 'B', 'C', 'D', 'E'] }, // Required with enum
    completed_meetings: [{
        meeting_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession.semesters.meetings', required: true }, // Reference to completed meeting
        meeting_date: { type: Date, required: true } // Date when the meeting was completed
    }], // Array of completed meetings
    created_at: { type: Date, default: Date.now }, // Date when the relationship was created
    updated_at: { type: Date, default: Date.now } // Date when the relationship was updated
});

mentorMenteeRelationshipSchema.statics.bulkAssign = async function (assignments) {
    const errors = [];
    const validAssignments = [];

    for (const assignment of assignments) {
        const { mentor_MUJid, mentee_MUJid } = assignment;

        const mentorExists = await Mentor.exists({ MUJid: mentor_MUJid });
        const menteeExists = await Mentee.exists({ MUJid: mentee_MUJid });

        if (!mentorExists) {
            errors.push(`Mentor with MUJid ${mentor_MUJid} does not exist`);
            continue;
        }

        if (!menteeExists) {
            errors.push(`Mentee with MUJid ${mentee_MUJid} does not exist`);
            continue;
        }

        validAssignments.push(assignment);
    }

    if (validAssignments.length > 0) {
        const bulkOps = validAssignments.map(({ mentor_MUJid, mentee_MUJid, session, current_semester, section }) => ({
            updateOne: {
                filter: { mentor_MUJid, mentee_MUJid },
                update: { mentor_MUJid, mentee_MUJid, session, current_semester, section },
                upsert: true
            }
        }));
        await this.bulkWrite(bulkOps);
    }

    return errors;
};

mentorMenteeRelationshipSchema.statics.assignMentor = async function (assignment) {
    const { mentor_MUJid, mentee_MUJid, session, current_semester, section } = assignment;

    const mentorExists = await Mentor.exists({ MUJid: mentor_MUJid });
    const menteeExists = await Mentee.exists({ MUJid: mentee_MUJid });

    if (!mentorExists) {
        throw new Error(`Mentor with MUJid ${mentor_MUJid} does not exist`);
    }

    if (!menteeExists) {
        throw new Error(`Mentee with MUJid ${mentee_MUJid} does not exist`);
    }

    return this.updateOne(
        { mentor_MUJid, mentee_MUJid },
        { mentor_MUJid, mentee_MUJid, session, current_semester, section },
        { upsert: true }
    );
};

const MentorMenteeRelationship = mongoose.models.MentorMenteeRelationship || mongoose.model("MentorMenteeRelationship", mentorMenteeRelationshipSchema);

export { MentorMenteeRelationship };