import { gql } from "graphql-tag";

export const subsidiaryTypeDef = gql`
  type Subsidiary {
    id: ID!
    name: String!
    code: String!
    country: String!
    status: String!
    createdAt: DateTime!
    userCount: Int
  }

  input CreateSubsidiaryInput {
    name: String!
    code: String!
    country: String!
    organizationId: String!
  }

  input UpdateSubsidiaryInput {
    subsidiaryId: String!
    name: String
    code: String
    country: String
  }

  extend type Mutation {
    createSubsidiary(input: CreateSubsidiaryInput!): Subsidiary!
    updateSubsidiary(input: UpdateSubsidiaryInput!): Subsidiary!
    deactivateSubsidiary(id: Int!): Subsidiary!
    reactivateSubsidiary(id: Int!): Subsidiary!
  }
`;