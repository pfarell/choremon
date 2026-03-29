import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { choreType, xp, userId } = body;

    if (!choreType || xp === undefined) {
      return NextResponse.json({ error: "Missing choreType or xp" }, { status: 400 });
    }

    // TODO: Save to Supabase when ready
    // For now just return success so Unity can confirm it works
    console.log(`Chore complete: ${choreType} | XP: ${xp} | User: ${userId}`);

    return NextResponse.json({
      success: true,
      message: "XP recorded",
      choreType,
      xp,
      userId,
    });

  } catch (err) {
    console.error("complete-chore error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}