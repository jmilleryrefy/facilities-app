import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'facility-requests',
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown'
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
