import { connect } from "../../../helper/dbConfig";
import { Form } from "../../../../lib/dbModels/dbModels";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req) {
  const { MUJid, status } = await req.json();

  try {
    await connect();

    const updatedForm = await Form.findOneAndUpdate(
      { mujid: MUJid },
      { status },
      { new: true }
    );

    return NextResponse.json({ updatedForm }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const MUJid = searchParams.get("MUJid");

  try {
    await connect();

    let forms;
    if (MUJid) {
      forms = await Form.find({ mujid: MUJid }).lean();
    } else {
      forms = await Form.find().lean();
    }

    // Fetch isFormFilled status from User schema using axios
    const response = await axios.get("/api/admin/manageUser", {
      params: { MUJid },
    });
    const userStatuses = response.data.users;
    const userStatusMap = userStatuses.reduce((acc, user) => {
      acc[user.mujid] = user.isFormFilled;
      return acc;
    }, {});

    forms = forms.map((form) => {
      const allSelectedCourses = Array.from(
        form.allSelectedCourses.entries()
      ).map(([key, value]) => ({
        courseType: key,
        labCourses: value.labCourses,
        theoryCourses: value.theoryCourses,
      }));

      return {
        ...form,
        isFormFilled: userStatusMap[form.mujid] || false,
        allSelectedCourses,
      };
    });

    return NextResponse.json({ forms }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
