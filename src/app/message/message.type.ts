export interface MessageResponse {
  messageId: string;
  chatId: string;
  messageText: string;
  userId: number|null;
  modelIaId: number|null;
  sendAt: Date;
}

export interface MessageWithModelResponse {
  messageId: string;
  chatId: string;
  messageText: string;
  userId: number|null;
  sendAt: Date;
  modelIaId: number|null;
  modelIaName: string|null;
  userName: string|null;
}