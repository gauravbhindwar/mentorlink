import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    default: "general"
  },
  updatedBy: {
    type: String,
    default: "system"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get a setting by key
settingsSchema.statics.getSettingByKey = async function(key) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : null;
};

// Static method to update or create a setting
settingsSchema.statics.updateSetting = async function(key, value, description = "", category = "general", updatedBy = "system") {
  const setting = await this.findOneAndUpdate(
    { key },
    { 
      value, 
      description, 
      category, 
      updatedBy,
      updatedAt: Date.now()
    },
    { 
      upsert: true, 
      new: true, 
      runValidators: true 
    }
  );
  return setting;
};

// Static method to get all settings by category
settingsSchema.statics.getSettingsByCategory = async function(category) {
  return await this.find({ category });
};

// Static method to delete a setting
settingsSchema.statics.deleteSetting = async function(key) {
  return await this.findOneAndDelete({ key });
};

export const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
