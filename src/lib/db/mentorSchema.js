import mongoose from "mongoose";

const mentorsSchema = new mongoose.Schema({
    academicRecords: [{
        academicYear: {
            type: String,
            validate: {
                validator: function(v) {
                    return /^\d{4}-\d{4}$/.test(v);
                },
                message: props => `${props.value} is not a valid academic year format (YYYY-YYYY)`
            }
        },
        sessions: [{
            sessionName: {
                type: String,
                enum: ['JULY-DECEMBER', 'JANUARY-JUNE']
            },
            mentorInfo: [{  // Changed to array
                name: { type: String },
                email: { 
                    type: String, 
                    required: true,
                    validate: {
                        validator: function(v) {
                            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                        },
                        message: props => `${props.value} is not a valid email address`
                    }
                },
                MUJid: { 
                    type: String, 
                    required: true,
                    uppercase: true,
                    sparse: true,
                    validate: {
                        validator: function(v) {
                            return /^[A-Z0-9]+$/.test(v);
                        },
                        message: props => `${props.value} is not a valid MUJid! Must be uppercase alphanumeric only.`
                    }
                },
                phone_number: { 
                    type: String, 
                    validate: {
                        validator: (value) => /^\d{10}$/.test(value),
                        message: "Phone number must be a 10-digit number"
                    }
                },
                address: { type: String },
                gender: { type: String },
                profile_picture: { type: String },
                role: { 
                    type: [String], 
                    enum: ['mentor', 'admin', 'superadmin'], 
                    default: ['mentor'] 
                },
                // Add auth fields here for each mentor
                auth: {
                    otp: { type: String },
                    otpExpires: { type: Date },
                    isOtpUsed: { type: Boolean, default: false },
                    isVerified: { type: Boolean, default: false }  // Add this field
                }
            }]
        }]
    }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Update indexes for the new array structure
mentorsSchema.index({
    'academicRecords.academicYear': 1,
    'academicRecords.sessions.sessionName': 1,
    'academicRecords.sessions.mentorInfo.email': 1
}, { 
    unique: true,
    sparse: true,
    partialFilterExpression: {
        'academicRecords.sessions.mentorInfo.email': { $type: 'string', $ne: '' }
    }
});

mentorsSchema.index({
    'academicRecords.sessions.mentorInfo.MUJid': 1,
    'academicRecords.academicYear': 1,
    'academicRecords.sessions.sessionName': 1
}, { 
    unique: true,
    sparse: true,
    partialFilterExpression: {
        'academicRecords.sessions.mentorInfo.MUJid': { $type: 'string', $ne: '' }
    }
});

// Add compound index for academic year and session filtering
mentorsSchema.index({
    'academicRecords.academicYear': 1,
    'academicRecords.sessions.sessionName': 1,
}, { 
    background: true 
});

// Add a pre-save middleware to ensure MUJid is uppercase
mentorsSchema.pre('save', function(next) {
    if (this.academicRecords) {
        this.academicRecords.forEach(record => {
            record.sessions.forEach(session => {
                if (session.mentorInfo && session.mentorInfo.MUJid) {
                    session.mentorInfo.MUJid = session.mentorInfo.MUJid.toUpperCase();
                }
            });
        });
    }
    next();
});

const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorsSchema);

export { Mentor };