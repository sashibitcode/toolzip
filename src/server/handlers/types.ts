export interface InputFileInfo {
  filepath: string;
  originalFilename: string;
  mimeType: string;
  size: number;
}

export interface ConversionContext {
  jobId: string;
  inputFiles: InputFileInfo[];
  outputDir: string;
  options?: Record<string, any>;
}

export interface ConversionResult {
  outputPath: string;
  outputFilename: string;
  mimeType: string;
}

export interface ToolHandler {
  convert: (context: ConversionContext) => Promise<ConversionResult>;
}
