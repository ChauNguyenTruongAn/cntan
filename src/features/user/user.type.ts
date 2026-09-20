export type CreateUserInput = {
  email: string;
  fullName: string;
  password: string;
  subsidiaryId: number;
  role?: string;
};

export type ChangeUserRoleInput = {
  userId: number;
  newRole: "SUPER_ADMIN" | "ORG_ADMIN" | "MEMBER";
};

export type UsersFilterInput = {
  search?: string | null;
  role?: string | null;
  status?: string | null;
  subsidiaryId?: number | null;
};

export type GetUsersArgs = {
  page?: number;
  limit?: number;
  filter?: UsersFilterInput | null;
  sortBy?: string | null;
};

