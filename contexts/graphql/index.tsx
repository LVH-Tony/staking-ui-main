"use client";

import React, { createContext, useContext } from "react";
import { useQuery, useMutation, gql, ApolloProvider } from "@apollo/client";
import { client } from "@/lib/apollo-client";

// Define your GraphQL queries
const GET_SUBNET_INFOS = gql`
  query GetSubnetInfos {
    subnetInfos {
      nodes {
        netUid
        alphaIn
        # Add other fields you need
      }
    }
  }
`;

// Define your GraphQL mutations
const CREATE_STAKE = gql`
  mutation CreateStake($input: CreateStakeInput!) {
    createStake(input: $input) {
      id
      # Add other fields you need
    }
  }
`;

type GraphQLContextType = {
  subnetInfos: any[];
  loading: boolean;
  error: any;
  createStake: (input: any) => Promise<any>;
};

const GraphQLContext = createContext<GraphQLContextType>({
  subnetInfos: [],
  loading: false,
  error: null,
  createStake: async () => {},
});

export const GraphQLProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data, loading, error } = useQuery(GET_SUBNET_INFOS, {
    client,
  });

  const [createStakeMutation] = useMutation(CREATE_STAKE, {
    client,
  });

  const createStake = async (input: any) => {
    try {
      const result = await createStakeMutation({
        variables: { input },
      });
      return result.data.createStake;
    } catch (error) {
      console.error("Error creating stake:", error);
      throw error;
    }
  };

  return (
    <ApolloProvider client={client}>
      <GraphQLContext.Provider
        value={{
          subnetInfos: data?.subnetInfos?.nodes || [],
          loading,
          error,
          createStake,
        }}
      >
        {children}
      </GraphQLContext.Provider>
    </ApolloProvider>
  );
};

export const useGraphQL = () => useContext(GraphQLContext);
