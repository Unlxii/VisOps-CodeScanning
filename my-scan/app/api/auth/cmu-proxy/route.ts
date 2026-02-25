import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  

  const cmuAuthUrl = process.env.CMU_ENTRAID_AUTHORIZATION_URL?.trim();
  if (!cmuAuthUrl) {
    return NextResponse.json({ error: "Missing CMU_ENTRAID_AUTHORIZATION_URL" }, { status: 500 });
  }

  const nextAuthParams = new URLSearchParams(url.searchParams);
  
  const customRedirectUri = process.env.CMU_ENTRAID_REDIRECT_URL?.trim() || "https://visscan.cpe.eng.cmu.ac.th/cmuEntraIDCallback";
  nextAuthParams.set("redirect_uri", customRedirectUri);

  // 4. Construct the final URL and seamlessly bounce the user to Microsoft
  const finalMicrosoftUrl = `${cmuAuthUrl}?${nextAuthParams.toString()}`;
  
  // Use a 302 Found redirect
  return NextResponse.redirect(finalMicrosoftUrl);
}
