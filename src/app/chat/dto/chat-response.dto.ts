export interface ChatSourceDto {
  documentTitle: string;
  sourceLink: string;
}

export interface ChatResponseDto {
  answer: string;
  sources: ChatSourceDto[];
}
