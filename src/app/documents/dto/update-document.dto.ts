import {createZodDto} from "nestjs-zod"
import {schemaUpdateDocument } from "../schema/document.schema";

export class UpdateDocumentDto extends createZodDto(schemaUpdateDocument) {
    
}