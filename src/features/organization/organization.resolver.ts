import { GraphQLContext } from "../../types/context";
import { requireAuth, requireRole } from "../common/guards";
import { organizationService } from "./organization.service";

export const organizationResolvers = {
  Query: {
    organizations: async (_: unknown, _args: unknown, context: GraphQLContext) => {
      requireRole(context, ["SUPER_ADMIN"]);
      return await organizationService.getOrganizationsWithSubsidiariesAndUser();
    },

    organization: async (_: unknown, args: { id: number }, context: GraphQLContext) => {
      requireAuth(context);
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

