import { connect } from "../../helper/dbConfig";
import { Form, User } from "../../../lib/dbModels/dbModels";
import { NextResponse } from "next/server";
export async function POST(req) {
  const { allSelectedCourses, isEven } = await req.json();

  if (!allSelectedCourses) {
    return NextResponse.json(
      { message: "allSelectedCourses are required" },
      { status: 400 }
    );
  }

  const MUJid = req.cookies.get("MUJid")?.value;
  if (!MUJid) {
    return NextResponse.json(
      { message: "MUJid is required in cookies" },
      { status: 400 }
    );
  }

  try {
    await connect();

    const user = await User.findOne({ mujid: MUJid });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const formEntry = new Form({
      allSelectedCourses,
      mujid: MUJid, //from cookies
      Name: user.name,
      email: user.email,
      Phone: user.phone,
      Designation: user.designation,
      isEven,
    });

    await formEntry.save();
    // want to update in User schema from database to update isFormFilled true

    user.isFormFilled = true;
    await user.save();

    return NextResponse.json(
      { message: "Form submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving form data:", error);
    return NextResponse.json(
      { message: "Error saving form data" },
      { status: 500 }
    );
  }
}
export async function GET(req) {
  await connect();
  const { searchParams } = new URL(req.url);
  const mujid = searchParams.get("mujid");

  if (mujid) {
    const forms = await Form.findOne({ mujid });
    return NextResponse.json({ forms }, { status: 200 });
  } else {
    const forms = await Form.find({});
    return NextResponse.json({ forms }, { status: 200 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const mujid = url.searchParams.get("mujid");
    console.log(mujid);
    if (!mujid) {
      return NextResponse.json(
        { message: "mujid is required" },
        { status: 400 }
      );
    }

    await connect();

    const form = await Form.findOneAndDelete({ mujid });

    if (!form) {
      return NextResponse.json({ message: "Form not found" }, { status: 404 });
    }

    // Update the User schema to set isFormFilled to false
    const user = await User.findOne({ mujid });

    if (user) {
      user.isFormFilled = false;
      await user.save();
    }

    return NextResponse.json(
      { message: "Form deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
