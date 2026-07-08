import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { Roles } from "@/enums/roles.enum";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const isSuperAdmin = user.role === Roles.SUPER_ADMIN;

    // Super admin can view all admins' folders (under pms_admin_uploads/)
    // Regular admin can only view their own folder (under pms_admin_uploads/admin_${user.id}/)
    const prefix = isSuperAdmin
      ? "pms_admin_uploads/"
      : `pms_admin_uploads/admin_${user.id}/`;

    const { resources } = await cloudinary.api.resources({
      type: "upload",
      prefix: prefix,
      max_results: 500,
    });

    return NextResponse.json({
      success: true,
      images: resources,
      userFolder: prefix,
      isSuperAdmin,
    });
  } catch (error: any) {
    console.error("Cloudinary get-all error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch images" },
      { status: 500 }
    );
  }
}
