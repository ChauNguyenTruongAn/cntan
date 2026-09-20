import { gql } from "graphql-tag";

export const authenticationTypeDefs = gql`
  input LoginInput {
    email: String!
    password: String!
  }

  type UserLogin {
    accessToken: String
    refreshToken: String
  }

  extend type Mutation {
    login(input: LoginInput!): UserLogin
  }
`;


