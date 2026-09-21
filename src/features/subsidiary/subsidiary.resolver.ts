import { GraphQLContext } from "../..";
import { requireAuth, requireRole, verifyRoleORGAdmin } from "../common/guards";
import {
  createSubsidiary,
  updateSubsidiary,
  deactivateSubsidiary,
  reactivateSubsidiary,
} from "./subsidiary.service";
import { CreateSubsidiaryInput, UpdateSubsidiaryInput } from "./subsidiary.type";
import { db } from "../../prisma/db";

export const subsidiaryResolvers = {
  Mutation: {
    createSubsidiary: async (
      _: unknown,
      _args: { input: CreateSubsidiaryInput },
      _context: GraphQLContext
    ) => {
      requireAuth(_context);
      requireRole(_context, ["SUPER_ADMIN", "ORG_ADMIN"]);
      verifyRoleORGAdmin(_context, Number(_args.input.organizationId));
      return await createSubsidiary(_args.input);
    },
    updateSubsidiary: async (
      _: unknown,
      _args: { input: UpdateSubsidiaryInput },
      _context: GraphQLContext
    ) => {
      requireAuth(_context);
      requireRole(_context, ["SUPER_ADMIN", "ORG_ADMIN"]);
      return await updateSubsidiary(_args.input, _context);
    },
    deactivateSubsidiary: async (
      _: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, ["SUPER_ADMIN", "ORG_ADMIN"]);
      return await deactivateSubsidiary(args.id, context);
    },
    reactivateSubsidiary: async (
      _: unknown,
      args: { id: number },
      context: GraphQLContext
    ) => {
      requireAuth(context);
      requireRole(context, ["SUPER_ADMIN", "ORG_ADMIN"]);
      return await reactivateSubsidiary(args.id, context);
    },
  },
  Subsidiary: {
    userCount: async (parent: { id: number | string; users?: any }) => {
      if (Array.isArray(parent.users)) {
        return parent.users.length;
      }
      if (typeof parent.users === "number") {
        return parent.users;
      }
      try {
        const countRes = await db.orm.public.Users
          .where((u) => u.subsidiaryId.eq(Number(parent.id)))
          .aggregate((agg) => ({ count: agg.count() }));
        return Number(countRes.count || 0);
      } catch {
        return 0;
      }
    },
  },
};
