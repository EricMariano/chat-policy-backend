import {createZodDto} from "nestjs-zod"
import { schemaJobDocument } from "../schema/document.schema";

export class JobDocumentDto extends createZodDto(schemaJobDocument) {
    
}