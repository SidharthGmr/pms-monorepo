import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { Roles } from "@/enums/roles.enum";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const { publicId } = await req.json();
    if (!publicId) {
      return NextResponse.json({ success: false, message: "publicId is required" }, { status: 400 });
    }

    const isSuperAdmin = user.role === Roles.SUPER_ADMIN;
    const adminFolder = `pms_admin_uploads/admin_${user.id}/`;

    // Security check: Regular admin can only delete their own files
    if (!isSuperAdmin && !publicId.startsWith(adminFolder)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: You can only delete your own files" },
        { status: 403 }
      );
    }

    const result = await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully from Cloudinary",
      result,
    });
  } catch (error: any) {
    console.error("Cloudinary delete error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
