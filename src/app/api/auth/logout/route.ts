import { NextResponse } from "next/server";

/**
 * Mock API Route: POST /api/auth/logout
 * Deletes authentication cookie on logout.
 */
export async function POST(request: Request) {
  const cookieName = process.env.COOKIE_NAME || "rewaa_auth";
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Check auth header or cookie to notify Laravel backend
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      await fetch(`${backendUrl}/api/dashboard/provider/auth/logout`, {
        method: "POST",
        headers: { Authorization: authHeader, Accept: "application/json" },
      }).catch(() => null);
    }
  } catch {
    // Ignore backend logout network failures
  }

  const response = NextResponse.json(
    {
      statusCode: 200,
      message: "Logged out successfully",
    },
    { status: 200 },
  );

  response.cookies.delete(cookieName);
  response.cookies.delete("rewaa_role");
  response.cookies.delete("rewaa_provider_token");
  response.cookies.delete("rewaa_student_token");
  return response;
}
