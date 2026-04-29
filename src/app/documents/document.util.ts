import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

export function createPath(dirName: string, fileName: string, mimetype: string) {
    const uploadsDir = join(process.cwd(), 'uploads', dirName);
    
    if (mimetype.includes("image")) {
        return join(uploadsDir, 'images', fileName);
    } else {
        return join(uploadsDir, 'documents', fileName);
    }
}

export async function saveFile(filePath: string, buffer: Buffer): Promise<void> {
    try {
        // Create directory if it doesn't exist
        await mkdir(dirname(filePath), { recursive: true });
        
        // Write the file
        await writeFile(filePath, buffer);
    } catch (error) {
        throw new Error(`Failed to save file: ${error instanceof Error ? error.message : String(error)}`);
    }
}