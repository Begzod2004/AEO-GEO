import { NextResponse } from "next/server";

import { saveLead } from "@/lib/waitlist";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let email = "";
  try {
    const body = await request.json();
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    await saveLead(email, new Date().toISOString());
  } catch {
    return NextResponse.json(
      { error: "Couldn't save your signup right now. Try again shortly." },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
