export interface UserByEmailResponse {
  email: string;
  name: string;
  userId: number;
}

export interface UserFilterResponse {
  userId: number;
  name: string;
  email: string;
  registeredAt: Date;
  typeUserId: number;
  active: boolean;
}
