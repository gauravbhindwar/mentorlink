import mongoose from "mongoose";

export async function connect() {
  if (mongoose.connections[0].readyState) return;
  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB is already connected");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const connection = mongoose.connection;

    connection.on("connected", (error) => {
      console.log("MongoDB connected successfully " + error);
    });

    connection.on("error", () => {
      console.log("MongoDB connection failed");
      process.exit();
    });
  } catch (error) {
    console.log("MongoDB connection Error");
  }
}
