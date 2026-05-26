
const pdfParse = require('pdf-parse');
import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'text/plain']);


export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string,
  _fileName: string,
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(mimetype)) {
    throw new BadRequestException(
      `Unsupported file type: ${mimetype}. Allowed: PDF, plain text (.txt)`,
    );
  }

  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8').trim();
  }

  if (mimetype === 'application/pdf') {
    try {
      const result = await pdfParse(buffer);
      return (result?.text ?? '').trim();
    } catch (err) {
      throw new BadRequestException(
        `Failed to extract text from PDF: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  throw new BadRequestException(`Unsupported file type: ${mimetype}`);
}

export const ALLOWED_UPLOAD_MIME_TYPES = Array.from(ALLOWED_MIME_TYPES);