import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the request exists and user owns it (or is admin)
    const facilityRequest = await prisma.facilityRequest.findUnique({
      where: { id },
    });

    if (!facilityRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      facilityRequest.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Validate and process files
    const attachments = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 10MB limit` },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `File "${file.name}" has unsupported type. Allowed: JPEG, PNG, GIF, WebP, PDF`,
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const attachment = await prisma.attachment.create({
        data: {
          requestId: id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: buffer,
        },
      });

      attachments.push({
        id: attachment.id,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        createdAt: attachment.createdAt,
      });
    }

    return NextResponse.json({ attachments }, { status: 201 });
  } catch (error) {
    console.error("Error uploading attachments:", error);
    return NextResponse.json(
      { error: "Failed to upload attachments" },
      { status: 500 }
    );
  }
}
