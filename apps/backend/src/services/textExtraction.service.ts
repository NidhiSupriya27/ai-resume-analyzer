import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new AppError(`File not found: ${filePath}`, 404);
  }

  const buffer = fs.readFileSync(absolutePath);

  try {
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      return cleanText(data.text);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return cleanText(result.value);
    }

    throw new AppError('Unsupported file type', 400);
  } catch (error) {
    logger.error('Text extraction failed', { filePath, mimeType, error });
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to extract text from file', 500);
  }
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
