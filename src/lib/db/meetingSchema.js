import mongoose from "mongoose";

const { Schema } = mongoose;

const meetingSchema = new Schema(
    {
        mentor: {
            type: Schema.Types.ObjectId,
            ref: "Mentor",
            required: true,
        },
        mentee: {
            type: Schema.Types.ObjectId,
            ref: "Mentee",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        topic: {
            type: String,
            required: true,
        },
        notes: {
            type: String,
        },
        feedback: {
            type: String,
        },
        semester: {
            type: Number,
            required: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        cancelled: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Meeting = mongoose.models.Meeting || mongoose.model("Meeting", meetingSchema);

export default Meeting;
