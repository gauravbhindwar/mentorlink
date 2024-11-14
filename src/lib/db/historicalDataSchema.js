
import mongoose from "mongoose";

const { Schema } = mongoose;

const historicalDataSchema = new Schema(
    {
        collectionName: {
            type: String,
            required: true,
        },
        documentId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        data: {
            type: Schema.Types.Mixed,
            required: true,
        },
        archivedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const HistoricalData = mongoose.models.HistoricalData || mongoose.model("HistoricalData", historicalDataSchema);

export default HistoricalData;