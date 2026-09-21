import { gql } from "graphql-tag";

export const userTypeDefs = gql`
  type User {
    id: ID!
    email: String!
    fullName: String!
    role: String!
    status: String!
    createdAt: DateTime!
    subsidiaryId: Int!
  }

  extend type Subsidiary {
    users: [User!]!
  }

  input CreateUserInput {
    email: String!
    fullName: String!
    password: String!
    subsidiaryId: Int!
    role: String # Mặc định là MEMBER nếu không truyền
  }

  input ChangeUserRoleInput {
    userId: Int!
    newRole: String! # SUPER_ADMIN, ORG_ADMIN, MEMBER
  }

  extend type Mutation {
    createUser(input: CreateUserInput!): User!
    changeUserRole(input: ChangeUserRoleInput!): User!
    deactivateUser(id: Int!): User!
    reactivateUser(id: Int!): User!
  }

  input UsersFilterInput {
    search: String
    role: String
    status: String
    subsidiaryId: Int
  }

  type PaginatedUsers {
    items: [User!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }
    
  extend type Query {
    users(
      page: Int = 1
      limit: Int = 10
      filter: UsersFilterInput
      sortBy: String # vd: "createdAt_DESC", "fullName_ASC"
    ): PaginatedUsers!
  }
`;
