// src/common/guards.ts
import { GraphQLError } from "graphql";
import { GraphQLContext, UserToken } from "../../types/context";

export function requireAuth(context: GraphQLContext): UserToken {
  if (!context.user) {
    throw new GraphQLError(
      "Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này",
      {
        extensions: { code: "UNAUTHENTICATED" },
      },
    );
  }
  return context.user;
}

export function requireRole(
  context: GraphQLContext,
  allowedRoles: string[],
): UserToken {
  const user = requireAuth(context);
  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError("Forbidden", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  return user;
}

export function verifyRoleORGAdmin(
  context: GraphQLContext,
  allowedOrg: number,
): UserToken {
  const user = requireAuth(context);
  if (user.role !== "SUPER_ADMIN" && user.organizationId !== allowedOrg) {
    throw new GraphQLError(
      "Forbidden: You don't have access to this Organization",
      {
        extensions: { code: "FORBIDDEN" },
      },
    );
  }
  return user;
}
