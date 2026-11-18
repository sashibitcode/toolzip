import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getToolBySlug } from '@/config/tools.config';
import { getHandler } from '@/server/handlers';
import { createJobWorkspace, sanitizeFilename, startAutoCleanup } from '@/server/utils/storage';
import { checkRateLimit } from '@/server/utils/rateLimit';

// Ensure auto cleanup is active
startAutoCleanup();

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const tool = getToolBySlug(slug);

    if (!tool) {
      return NextResponse.json(
        { success: false, error: `Tool '${slug}' not found` },
        { status: 404 }
      );
    }

    // 1. Rate limiting by IP
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rate = checkRateLimit(clientIp);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many conversion requests. Please wait ${Math.ceil(
            rate.resetMs / 1000
          )} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const optionsRaw = formData.get('options') as string | null;
    let options: Record<string, any> = {};
    if (optionsRaw) {
      try {
        options = JSON.parse(optionsRaw);
      } catch {
        options = {};
      }
    }

    if (!files || files.length === 0 || !(files[0] instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No files were uploaded.' },
        { status: 400 }
      );
    }

    // Check multiple files restriction
    if (files.length > 1 && !tool.allowMultiple) {
      return NextResponse.json(
        { success: false, error: `${tool.title} only accepts a single file at a time.` },
        { status: 400 }
      );
    }

    // 3. Validate file types & sizes
    const maxSizeBytes = tool.maxFileSizeMB * 1024 * 1024;
    for (const file of files) {
      if (file.size > maxSizeBytes) {
        return NextResponse.json(
          {
            success: false,
            error: `File '${file.name}' exceeds the maximum allowed size of ${tool.maxFileSizeMB}MB.`,
          },
          { status: 400 }
        );
      }

      const ext = path.extname(file.name).toLowerCase();
      const isExtAllowed = tool.acceptedExtensions.some((e) => e.toLowerCase() === ext);

      if (!isExtAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: `File type '${ext}' is not supported for ${tool.title}. Allowed types: ${tool.acceptedExtensions.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // 4. Resolve conversion handler
    const handler = getHandler(tool.handlerName);
    if (!handler) {
      return NextResponse.json(
        { success: false, error: `Handler '${tool.handlerName}' not configured on server.` },
        { status: 500 }
      );
    }

    // 5. Create isolated workspace
    const workspace = createJobWorkspace();

    // 6. Save input files to workspace
    const inputFiles = [];
    for (const file of files) {
      const safeName = sanitizeFilename(file.name);
      const destination = path.join(workspace.inputDir, safeName);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(destination, buffer);

      inputFiles.push({
        filepath: destination,
        originalFilename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      });
    }

    // 7. Execute conversion
    const result = await handler.convert({
      jobId: workspace.jobId,
      inputFiles,
      outputDir: workspace.outputDir,
      options,
    });

    // 8. Verify output file exists
    if (!fs.existsSync(result.outputPath)) {
      throw new Error('Conversion completed but output file was not produced.');
    }

    const outputStats = fs.statSync(result.outputPath);

    return NextResponse.json({
      success: true,
      jobId: workspace.jobId,
      downloadUrl: `/api/download/${workspace.jobId}`,
      filename: result.outputFilename,
      mimeType: result.mimeType,
      size: outputStats.size,
    });
  } catch (error: any) {
    console.error('Conversion API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'An unexpected error occurred during file conversion.',
      },
      { status: 500 }
    );
  }
}
