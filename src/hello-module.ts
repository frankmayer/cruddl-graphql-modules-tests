import { gql } from "graphql-modules";

export const helloModuleSdlObject = {
  typeDefs: [
    gql`
      type Query {
        hello: String
      }
    `,
  ],
  resolvers: {
    Query: {
      hello: () => {
        return "world";
      },
    },
  },
};
