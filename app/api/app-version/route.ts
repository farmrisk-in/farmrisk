import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      minVersion: "1.0.1",
      latestVersion: "1.0.1",
      minVersionCode: 2,
      forceUpdate: true,
      title: "Update Required",
      message:
        "A critical update is required to continue using FarmRisk. Please update the app from Google Play Store to access live mandi prices, updated weather forecasts, and advisory features.",
      storeUrl: "market://details?id=in.farmrisk.app",
      playStoreWebUrl: "https://play.google.com/store/apps/details?id=in.farmrisk.app",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
