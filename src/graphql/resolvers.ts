import { authenticationResolvers } from "../features/authentication/authentication.resolvers";
import { organizationResolvers } from "../features/organization/organization.resolver";
import { subsidiaryResolvers } from "../features/subsidiary/subsidiary.resolver";
import { userResolvers } from "../features/user/user.resolver";
import { DateTimeScalar } from "./scalars/dateTime";

export const resolvers = [
    {DateTime: DateTimeScalar},
    organizationResolvers,
    subsidiaryResolvers,
    userResolvers,
    authenticationResolvers,
]