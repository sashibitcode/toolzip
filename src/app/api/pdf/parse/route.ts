import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createJobWorkspace, sanitizeFilename } from '@/server/utils/storage';
import { parsePdfForEditing } from '@/server/utils/pdfParser';
import { checkRateLimit } from '@/server/utils/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rate = checkRateLimit(clientIp);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No PDF file was provided.' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Please upload a valid .pdf file.' },
        { status: 400 }
      );
    }

    const workspace = createJobWorkspace();
    const safeName = sanitizeFilename(file.name);
    const destination = path.join(workspace.inputDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(destination, buffer);

    const parsedDoc = await parsePdfForEditing(destination);

    return NextResponse.json({
      success: true,
      jobId: workspace.jobId,
      filename: safeName,
      parsedDoc,
    });
  } catch (err: any) {
    console.error('PDF Parse API error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to parse PDF document for editing.' },
      { status: 500 }
    );
  }
}
