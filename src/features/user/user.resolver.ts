import { GraphQLContext } from "../../types/context";
import { requireAuth, requireRole } from "../common/guards";
import {
  createUser,
  changeUserRole,
  getUsers,
  deactivateUser,
  reactivateUser,
  getUsersBySubsidiaryId,
} from "./user.service";
import { CreateUserInput, ChangeUserRoleInput, GetUsersArgs } from "./user.type";

export const userResolvers = {
  Query: {
    users: async (_: unknown, args: GetUsersArgs, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, ["SUPER_ADMIN", "ORG_ADMIN", "MEMBER"]);
      return await getUsers(args, context);
    },
  },
  Mutation: {
    createUser: async (
      _: unknown,
      args: { input: CreateUserInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, ["SUPER_ADMIN", "ORG_ADMIN"]);
      return await createUser(args.input, context);
    },

    changeUserRole: async (
      _: unknown,
      args: { input: ChangeUserRoleInput },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, ["SUPER_ADMIN", "ORG_ADMIN"]);
      return await changeUserRole(args.input, context);
    },

    deactivateUser: async (
      _: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, ["SUPER_ADMIN", "ORG_ADMIN"]);
      return await deactivateUser(args.id, context);
    },

    reactivateUser: async (
      _: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, ["SUPER_ADMIN", "ORG_ADMIN"]);
      return await reactivateUser(args.id, context);
    },
  },
  Subsidiary: {
    users: async (parent: { id: number | string }) => {
      return await getUsersBySubsidiaryId(Number(parent.id));
    },
  },
};
