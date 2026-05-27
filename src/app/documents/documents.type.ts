export interface DocumentWithAuthorResponse {
  documentId: string;
  title: string;
  lastUpdateAt: Date;
  active: boolean;
  authorName: string;
}

export interface DocumentVersionWithAuthorResponse {
  documentVersionId: string;
  documentId: string;
  version: string;
  documentPath: string;
  hash: string;
  status: string;
  createdAt: Date;
  authorName: string;
}
