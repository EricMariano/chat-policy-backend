export interface ChatResponse {
  chatId: string;
  title: string;
  createdAt: Date;
  lastUpdateAt: Date;
}

export interface ChatListResponse {
  chats: ChatResponse[];
  finish: boolean;
  nextCursor?: string;
}
