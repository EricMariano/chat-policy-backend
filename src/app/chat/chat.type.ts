export interface ChatResponse {
  chatId: string;
  title: string;
  createdAt: Date;
  lastUpdateAt: Date;
}

export interface ChatPermResponse {
  chatId: string;
  title: string;
  userId: number;
  isOwner: boolean;
  roleChatId: number | null;
}

export interface ChatListResponse {
  chats: ChatResponse[];
  finish: boolean;
  nextCursor?: string;
}

export interface SharedChatResponse {
  chat_id: string;
  title: string;
  role_chat_nm: string;
  owner: string;
  lastUpdateAt: Date;
}

export interface ChatScrollingResponse {
  chatId: string;
  title: string;
  userId: number;
  createdAt: Date;
  lastUpdateAt: Date;
}

export interface ChatPermissionResponse {
  userNm: string;
  typeAccess: string;
  userId: number;
  email:string;
}
