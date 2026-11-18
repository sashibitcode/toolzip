import assert from 'node:assert';
import test from 'node:test';
import { toolsConfig, ToolConfig } from '../src/config/tools.config';
import { toolHandlers, ToolHandler, ConversionContext, ConversionResult } from '../src/server/handlers';

test('5. Extensibility contract: dynamically registering a new tool', async () => {
  // Step 1: Define a new handler
  const sampleCustomHandler: ToolHandler = {
    async convert(ctx: ConversionContext): Promise<ConversionResult> {
      return {
        outputPath: '/tmp/output.pdf',
        outputFilename: 'sample.pdf',
        mimeType: 'application/pdf',
      };
    },
  };

  // Register handler
  toolHandlers['customCompressPdf'] = sampleCustomHandler;

  // Step 2: Define the new tool config entry
  const newToolConfig: ToolConfig = {
    id: 'compress-pdf',
    title: 'Compress PDF',
    slug: 'compress-pdf',
    category: 'from-pdf',
    description: 'Reduce PDF file size while maintaining maximum quality.',
    shortDesc: 'Compress PDF file size',
    icon: 'ShieldCheck',
    badgeColor: 'rose',
    acceptedMimeTypes: ['application/pdf'],
    acceptedExtensions: ['.pdf'],
    maxFileSizeMB: 100,
    allowMultiple: false,
    outputExtension: '.pdf',
    outputMimeType: 'application/pdf',
    handlerName: 'customCompressPdf',
    seoTitle: 'Compress PDF Online - Reduce File Size | TOOLZIP',
    seoDescription: 'Compress PDF files easily and safely.',
    steps: [
      { step: 1, title: 'Upload', desc: 'Select PDF.' },
      { step: 2, title: 'Compress', desc: 'Click compress.' },
      { step: 3, title: 'Download', desc: 'Save smaller PDF.' },
    ],
    faqs: [],
  };

  // Verify that the new tool config is valid and resolves its handler
  assert.ok(toolHandlers[newToolConfig.handlerName], 'Handler must resolve from registry');
  const result = await toolHandlers[newToolConfig.handlerName].convert({
    jobId: 'test-job',
    inputFiles: [],
    outputDir: '/tmp',
  });

  assert.strictEqual(result.outputFilename, 'sample.pdf');
  assert.strictEqual(result.mimeType, 'application/pdf');

  // Clean up test entry
  delete toolHandlers['customCompressPdf'];
});
