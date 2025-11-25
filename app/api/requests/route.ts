import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewRequestNotification } from "@/lib/email";
import { Severity, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    // Build query conditions
    const where: Prisma.FacilityRequestWhereInput = {};

    // Non-admins can only see their own requests
    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id;
    } else if (userId) {
      // Admins can filter by userId if provided
      where.userId = userId;
    }

    // Filter by status if provided
    if (status) {
      where.status = status as Prisma.EnumRequestStatusFilter;
    }

    const requests = await prisma.facilityRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            jobTitle: true,
          },
        },
        responses: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { location, description, severity } = body;

    // Validation
    if (!location || !description) {
      return NextResponse.json(
        { error: "Location and description are required" },
        { status: 400 }
      );
    }

    if (severity && !Object.values(Severity).includes(severity)) {
      return NextResponse.json(
        { error: "Invalid severity value" },
        { status: 400 }
      );
    }

    // Create the request
    const facilityRequest = await prisma.facilityRequest.create({
      data: {
        userId: session.user.id,
        location,
        description,
        severity: severity || Severity.MEDIUM,
      },
      include: {
        user: true,
      },
    });

    // Send email notification (non-blocking)
    sendNewRequestNotification(facilityRequest, facilityRequest.user).catch(
      (error) => console.error("Failed to send notification:", error)
    );

    return NextResponse.json(facilityRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
