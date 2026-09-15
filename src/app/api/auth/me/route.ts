import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const mockUser = {
  id: "usr_mock_123",
  email: "user@rewaa.com",
  firstName: "علي",
  lastName: "أحمد",
  role: "admin",
  emailVerified: true,
  createdAt: new Date().toISOString(),
};

/**
 * Mock API Route: GET /api/auth/me
 * Checks if authentication cookie exists. Returns 401 if missing.
 */
export async function GET() {
  const cookieStore = await cookies();
  const cookieName = process.env.COOKIE_NAME || "rewaa_auth";
  const authCookie = cookieStore.get(cookieName);
  const roleCookie = cookieStore.get("rewaa_role");

  if (!authCookie || !authCookie.value) {
    return NextResponse.json(
      {
        statusCode: 401,
        message: "Unauthorized",
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const role = roleCookie?.value === "student" ? "student" : "assistant";
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Try live Laravel backend if authCookie looks like a Sanctum token
  if (authCookie.value && authCookie.value !== "mock_session_token_xyz") {
    try {
      const endpoint =
        role === "student"
          ? `${backendUrl}/api/website/profile`
          : `${backendUrl}/api/dashboard/provider/profile`;

      const backendRes = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authCookie.value}`,
          Accept: "application/json",
        },
      });

      if (backendRes.ok) {
        const backendJson = await backendRes.json();
        const profileData = backendJson.data?.user || backendJson.data?.student || backendJson.data;

        if (profileData) {
          return NextResponse.json(
            {
              statusCode: 200,
              message: "Profile retrieved successfully",
              data: {
                id: String(profileData.id),
                email: profileData.email,
                firstName: profileData.first_name || profileData.full_name?.split(" ")[0] || "User",
                lastName: profileData.family_name || profileData.full_name?.split(" ")[1] || "",
                role,
                emailVerified: true,
                createdAt: profileData.created_at || new Date().toISOString(),
              },
            },
            { status: 200 },
          );
        }
      }
    } catch (e) {
      console.warn("Backend profile query failed, using fallback:", e);
    }
  }

  return NextResponse.json(
    {
      statusCode: 200,
      message: "Profile retrieved successfully",
      data: {
        ...mockUser,
        role,
      },
    },
    { status: 200 },
  );
}
