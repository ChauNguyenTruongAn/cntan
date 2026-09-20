import { gql } from "graphql-tag";
import { organizationTypeDefs } from "../features/organization/organization.typeDefs";
import { authenticationTypeDefs } from "../features/authentication/authentication.typeDefs";
import { userTypeDefs } from "../features/user/user.typeDefs";
import { subsidiaryTypeDef } from "../features/subsidiary/subsidiary.typeDef";

export const typeDefs = [
  gql`
    scalar DateTime

    type Query {
      _empty: String
    }

    type Mutation {
      _empty: String
    }
  `,
  organizationTypeDefs,
  subsidiaryTypeDef,
  userTypeDefs,
  authenticationTypeDefs,
];