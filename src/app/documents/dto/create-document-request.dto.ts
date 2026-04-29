import {createZodDto} from "nestjs-zod"
import { schemaCreateDocument } from "../schema/document.schema";

export class CreateDocumentDto extends createZodDto(schemaCreateDocument) {
    
}