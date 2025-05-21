import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const httpLink = createHttpLink({
  uri: "https://api.app.trustedstake.ai/graphql",
  fetchOptions: {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  },
  credentials: "include",
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
