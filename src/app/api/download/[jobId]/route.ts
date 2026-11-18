import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getJobOutputFile } from '@/server/utils/storage';

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const output = getJobOutputFile(jobId);

    if (!output || !fs.existsSync(output.filepath)) {
      return NextResponse.json(
        { error: 'File not found or has expired (files are deleted after 30 minutes).' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(output.filepath);
    const ext = path.extname(output.filename).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    // Encode filename for Content-Disposition header
    const encodedFilename = encodeURIComponent(output.filename);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${output.filename}"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
