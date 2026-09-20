import {gql} from 'graphql-tag'

export const organizationTypeDefs = gql`
    type Organization{
        id: ID!
        name: String!
        code: String!
        status: String!
        createdAt: DateTime!
        subsidiaries: [Subsidiary]!
    }

    extend type Query {
        organizations: [Organization!]!
        organization(id: Int!): Organization
    }

    extend type Mutation {
        deactivateOrganization(id: Int!): Organization!
        reactivateOrganization(id: Int!): Organization!
    }
`

