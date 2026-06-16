export interface DocumentWithAuthorResponse {
  documentId: string;
  title: string;
  lastUpdateAt: Date;
  active: boolean;
  authorName: string;
  lastVersion: {
    documentVersionId: string;
    version: string;
    status: string | null;
    active: boolean;
    createdAt: Date;
  } | null;
}

export interface DocumentVersionWithAuthorResponse {
  documentVersionId: string;
  documentId: string;
  version: string;
  documentPath: string;
  hash: string;
  status: string;
  active: boolean;
  createdAt: Date;
  authorName: string;
}

export interface DocumentDetailResponse extends DocumentWithAuthorResponse {
  departmentIds: number[];
  systemIds: number[];
}
