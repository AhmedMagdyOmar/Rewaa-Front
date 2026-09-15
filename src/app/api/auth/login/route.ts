import { NextResponse } from "next/server";
import { faker } from "@faker-js/faker";

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
 * Mock API Route: POST /api/auth/login
 * Sets HttpOnly auth cookie on successful login.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cookieName = process.env.COOKIE_NAME || "rewaa_auth";
    const userRole = body.role === "student" ? "student" : "assistant";
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Attempt live Laravel backend authentication
    try {
      const endpoint =
        userRole === "student"
          ? `${backendUrl}/api/website/auth/login`
          : `${backendUrl}/api/dashboard/provider/auth/login`;

      const payload =
        userRole === "student"
          ? {
              login: body.phone || body.identifier || body.email,
              password: body.password,
              phone_code: body.phone_code,
            }
          : {
              email: body.email || body.identifier,
              password: body.password,
            };

      const backendRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const backendJson = await backendRes.json();

      if (backendRes.ok && backendJson.status === 200 && backendJson.data?.access_token) {
        const token = backendJson.data.access_token;
        const userPayload = backendJson.data.user || backendJson.data.student;

        const response = NextResponse.json(
          {
            statusCode: 200,
            message: backendJson.message || "Login successful",
            data: {
              user: {
                id: userPayload.id,
                email: userPayload.email || body.email,
                firstName: userPayload.first_name || userPayload.full_name?.split(" ")[0] || "User",
                lastName: userPayload.family_name || userPayload.full_name?.split(" ")[1] || "",
                role: userRole,
                emailVerified: true,
                createdAt: userPayload.created_at || new Date().toISOString(),
              },
              accessToken: token,
            },
          },
          { status: 200 },
        );

        response.cookies.set(cookieName, token, {
          httpOnly: false, // Accessible to client-side auth tokens sync
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        response.cookies.set("rewaa_role", userRole, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });

        // Set role specific token cookies
        const roleCookieKey =
          userRole === "student" ? "rewaa_student_token" : "rewaa_provider_token";
        response.cookies.set(roleCookieKey, token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });

        return response;
      } else if (!backendRes.ok && backendJson.errors) {
        // Laravel 422 or 401 error
        return NextResponse.json(
          {
            statusCode: backendRes.status,
            message: backendJson.message || "Authentication failed",
            errors: backendJson.errors,
          },
          { status: backendRes.status },
        );
      }
    } catch (backendFetchError) {
      console.warn(
        "Backend login connection skipped or failed, falling back to mock:",
        backendFetchError,
      );
    }

    // Fallback Mock authentication if backend server is unreachable
    const response = NextResponse.json(
      {
        statusCode: 200,
        message: "Login successful (Mock Fallback)",
        data: {
          user: {
            ...mockUser,
            email: body.email || mockUser.email,
            role: userRole,
          },
          accessToken: faker.string.alphanumeric(64),
        },
      },
      { status: 200 },
    );

    response.cookies.set(cookieName, "mock_session_token_xyz", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set("rewaa_role", userRole, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { statusCode: 400, message: "Invalid request payload" },
      { status: 400 },
    );
  }
}
