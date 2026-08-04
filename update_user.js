const mongoose = require("mongoose");
const MONGODB_URI = "mongodb+srv://Gaurav:Gaurav112@cluster0.icwj0yc.mongodb.net/mentorlink?retryWrites=true&w=majority&appName=Cluster0";

const mentorsSchema = new mongoose.Schema({
  name: { type: String, default: null },
  email: { type: String, required: true, unique: true },
  role: { type: [String], default: ["mentor"] },
  isActive: { type: Boolean, default: true },
  MUJid: { type: String }
}, { strict: false });
const Mentor = mongoose.models.Mentor || mongoose.model("Mentor", mentorsSchema);

mongoose.connect(MONGODB_URI).then(async () => {
  const email = "gaurav.12bhindwar@gmail.com";
  let mentor = await Mentor.findOne({ email });
  if (mentor) {
    mentor.MUJid = "SUPERADMIN";
    await mentor.save();
    console.log("User updated successfully with valid MUJid!");
  } else {
    console.log("User not found!");
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
