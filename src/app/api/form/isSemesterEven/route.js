import { connect } from "../../../helper/dbConfig";
import { Term } from "../../../../lib/dbModels/dbModels";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function GET(req) {
  const admin = cookies().get("admin")?.value;
  // console.log(admin);
  try {
    await connect();
    // const term = await Term.find().exec();
    const terms = await Term.findOne({});
    const forTerm = terms.forTerm;
    return NextResponse.json({ forTerm }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching terms" },
      { status: 500 }
    );
  }
}
