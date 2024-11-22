import { connect } from "../../../lib/dbConfig";
import {Mentee }from "../../../lib/dbModels";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        await connect();
        const { searchParams } = new URL(req.url);
        const filters = {
            year: searchParams.get('year'),
            term: searchParams.get('term'),
            semester: searchParams.get('semester'),
            section: searchParams.get('section')
        };

        const mentees = await Mentee.searchMentees(filters);
        return NextResponse.json(mentees);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connect();
        const data = await req.json();
        const mentee = await Mentee.create(data);
        return NextResponse.json(mentee, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await connect();
        const data = await req.json();
        const { mujid, ...updates } = data;
        const mentee = await Mentee.findOneAndUpdate(
            { mujid },
            updates,
            { new: true }
        );
        return NextResponse.json(mentee);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
