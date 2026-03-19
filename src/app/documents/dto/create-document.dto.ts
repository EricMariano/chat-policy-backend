export class CreateDocumentDto {
  title: string;
  sourceLink: string;
  text: string;
  fileName?: string;
  createdById?: string;
}
