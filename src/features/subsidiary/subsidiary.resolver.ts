import { GraphQLContext } from "../..";
import { requireAuth, requireRole, verifyRoleORGAdmin } from "../common/guards";
import {
  createSubsidiary,
  updateSubsidiary,
  deactivateSubsidiary,
  reactivateSubsidiary,
} from "./subsidiary.service";
import { CreateSubsidiaryInput, UpdateSubsidiaryInput } from "./subsidiary.type";

// src/features/subsidiary/subsidiary.resolvers.ts
export const subsidiaryResolvers = {
    Mutation: {
        createSubsidiary: async (_: unknown, _args: {input: CreateSubsidiaryInput}, _context: GraphQLContext) => {
            requireAuth(_context)
            requireRole(_context, ["SUPER_ADMIN", "ORG_ADMIN"])
            verifyRoleORGAdmin(_context, Number(_args.input.organizationId))
            return await createSubsidiary(_args.input)
        },
    updateSubsidiary: async (_: unknown, _args: {input: UpdateSubsidiaryInput}, _context: GraphQLContext) => {
        requireAuth(_context);
        requireRole(_context, ["SUPER_ADMIN", "ORG_ADMIN"]);
        return await updateSubsidiary(_args.input ,_context);
    },
    deactivateSubsidiary: async (_: unknown, args: { id: number }, context: GraphQLContext) => {
        requireAuth(context);
        requireRole(context, ["SUPER_ADMIN", "ORG_ADMIN"]);
        return await deactivateSubsidiary(args.id, context);
    },
    reactivateSubsidiary: async (_: unknown, args: { id: number }, context: GraphQLContext) => {
        requireAuth(context);
        requireRole(context, ["SUPER_ADMIN", "ORG_ADMIN"]);
        return await reactivateSubsidiary(args.id, context);
    },
  },
    Subsidiary: {
    userCount: (parent: { users?: number }) => {
      return parent.users ?? 0;
    },
  },
};
