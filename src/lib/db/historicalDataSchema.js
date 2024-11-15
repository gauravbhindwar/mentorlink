import mongoose from "mongoose";

const historicalDataSchema = new mongoose.Schema({
    year: { 
        type: Number, 
        required: true,
        validate: {
            validator: (value) => {
                const currentYear = new Date().getFullYear();
                return value >= currentYear - 10 && value <= currentYear;
            },
            message: "Year must be within the last 10 years"
        }
    }, // Year of the historical data
    academic_session: { type: String, required: true }, // Academic session (e.g., 2023-2024)
    semester: { type: Number, required: true }, // Semester number
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // Dynamic data for the year
    created_at: { type: Date, default: Date.now }, // Creation date of the record
    updated_at: { type: Date, default: Date.now } // Last update timestamp for the record
});

const HistoricalData = mongoose.models.HistoricalData || mongoose.model("HistoricalData", historicalDataSchema);

export { HistoricalData };