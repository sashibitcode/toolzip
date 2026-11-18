import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getJobPaths } from '@/server/utils/storage';
import { editPdfHandler } from '@/server/handlers/editPdf';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, edits } = body;

    if (!jobId || !edits) {
      return NextResponse.json(
        { success: false, error: 'Missing jobId or edits data.' },
        { status: 400 }
      );
    }

    const paths = getJobPaths(jobId);
    if (!paths || !fs.existsSync(paths.inputDir)) {
      return NextResponse.json(
        { success: false, error: 'Session expired or not found. Please re-upload your PDF.' },
        { status: 404 }
      );
    }

    const inputFilesList = fs.readdirSync(paths.inputDir);
    if (inputFilesList.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Original PDF file was not found in session.' },
        { status: 404 }
      );
    }

    const originalFilename = inputFilesList[0];
    const originalFilepath = path.join(paths.inputDir, originalFilename);

    const result = await editPdfHandler.convert({
      jobId,
      inputFiles: [
        {
          filepath: originalFilepath,
          originalFilename,
          mimeType: 'application/pdf',
          size: fs.statSync(originalFilepath).size,
        },
      ],
      outputDir: paths.outputDir,
      options: { edits },
    });

    const stats = fs.statSync(result.outputPath);

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/download/${jobId}`,
      filename: result.outputFilename,
      size: stats.size,
    });
  } catch (err: any) {
    console.error('PDF Save Edits error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save PDF modifications.' },
      { status: 500 }
    );
  }
}
