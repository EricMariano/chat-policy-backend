import type {JwtPayload as JWT} from "jsonwebtoken"

export interface JwtPayload extends JWT {
  userId: number;
  userTypeId: number;
}