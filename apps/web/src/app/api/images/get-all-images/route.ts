import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    const { resources } = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      max_results: 500,
    });

    return NextResponse.json({
      success: true,
      count: resources.length,
      images: resources,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch images",
      },
      {
        status: 500,
      }
    );
  }
}