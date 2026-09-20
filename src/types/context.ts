// src/types/context.ts
export interface UserToken {
  email: string;
  fullName: string;
  role: string;
  subsidiaryId: number;
  organizationId: number;
}

export interface GraphQLContext {
  token?: string | null;
  user?: UserToken | null;
}
