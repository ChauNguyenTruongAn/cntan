import { GraphQLContext } from "../../types/context";
import { requireAuth, requireRole, verifyRoleORGAdmin } from "../common/guards";
import { organizationService } from "./organization.service";

export const organizationResolvers = {
  Query: {
    organizations: async (_: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      if (user.role === "SUPER_ADMIN") {
        return await organizationService.getOrganizationsWithSubsidiariesAndUser();
      }
      // ORG_ADMIN and MEMBER are scoped to their own Organization
      const org = await organizationService.getOrganizationById(user.organizationId);
      return org ? [org] : [];
    },

    organization: async (_: unknown, args: { id: number }, context: GraphQLContext) => {
      requireAuth(context);
      verifyRoleORGAdmin(context, args.id);
      return await organizationService.getOrganizationById(args.id);
    },
  },
  Mutation: {
    deactivateOrganization: async (_: unknown, args: { id: number }, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, ["SUPER_ADMIN"]);
      return await organizationService.deactivateOrganization(args.id, context);
    },
    reactivateOrganization: async (_: unknown, args: { id: number }, context: GraphQLContext) => {
      requireAuth(context);
      requireRole(context, ["SUPER_ADMIN"]);
      return await organizationService.reactivateOrganization(args.id);
    },
  },
};
