import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getPlan, upiUri } from "@/lib/credits-config";

export const runtime = "nodejs";

/**
 * Amount-specific UPI QR for a plan. Each plan encodes its own UPI deep link
 * (pa/pn/am), so selecting a plan on the paywall swaps to a QR that pays the
 * correct amount. Returns an SVG so it scales crisply.
 */
export async function GET(req: Request) {
  const planId = new URL(req.url).searchParams.get("plan");
  const plan = getPlan(planId);
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });

  const svg = await QRCode.toString(upiUri(plan), {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return new NextResponse(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
