import {createZodDto} from "nestjs-zod"
import { schemaNewVersionDocument } from "../schema/document.schema";

export class NewVersionDocumentDto extends createZodDto(schemaNewVersionDocument) {
    
}