import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "@/lib/auth/session";
import {
  countTryOnsInWindow,
  getShanghaiDayWindow,
  getTryOnEntitlement,
} from "@/lib/try-on-access";
import { getErrorMessage } from "@/lib/error-utils";

export async function GET(req: NextRequest) {
  try {
    const access = await getActiveSessionUser(req.headers);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const entitlement = await getTryOnEntitlement(access.user.id);
    const usageWindow = getShanghaiDayWindow();
    const usedToday = await countTryOnsInWindow(access.user.id, usageWindow);

    return NextResponse.json({
      entitlement,
      usedToday,
      remainingToday: Math.max(entitlement.dailyLimit - usedToday, 0),
      usageWindow: {
        start: usageWindow.start.toISOString(),
        end: usageWindow.end.toISOString(),
        timeZone: "Asia/Shanghai",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to load try-on entitlement") },
      { status: 500 }
    );
  }
}
