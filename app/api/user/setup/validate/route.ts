// app/api/user/setup/validate/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateAllTokens } from "@/lib/tokenValidator";

/**
 * @swagger
 * /api/user/setup/validate:
 *   post:
 *     summary: Validate GitHub and Docker tokens without saving them
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [githubPAT, githubUsername, dockerUsername, dockerToken]
 *             properties:
 *               githubPAT:
 *                 type: string
 *               githubUsername:
 *                 type: string
 *               dockerUsername:
 *                 type: string
 *               dockerToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation result
 *       400:
 *         description: Token validation failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Validation failed
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { githubPAT, githubUsername, dockerUsername, dockerToken } =
      await req.json();

    // Validate input
    if (!githubPAT || !githubUsername || !dockerUsername || !dockerToken) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate tokens against external APIs
    const validationResult = await validateAllTokens(
      githubPAT,
      dockerUsername,
      dockerToken
    );

    if (!validationResult.githubValid || !validationResult.dockerValid) {
      return NextResponse.json(
        {
          error: "Token validation failed",
          githubValid: validationResult.githubValid,
          dockerValid: validationResult.dockerValid,
          errors: validationResult.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      githubValid: true,
      dockerValid: true,
      githubUsername: validationResult.githubUsername || githubUsername,
      dockerUsername: dockerUsername,
    });
  } catch (error: any) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: error.message || "Validation failed" },
      { status: 500 }
    );
  }
}
