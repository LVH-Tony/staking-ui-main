"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Subnet, ValidatorInfo } from "@/types";
import { loadValidators } from "@/utils";
import { useSubnets } from "@/hooks/useSubnets";

// Define context type
interface SubnetAndValidatorContextType {
  subnets: Subnet[];
  validators: ValidatorInfo[];
  loading: boolean;
  getSubnetById: (id: number) => Subnet | undefined;
  getValidatorByHotkey: (address: string) => ValidatorInfo | undefined;
}

// Create context with proper default value
const SubnetAndValidatorContext =
  createContext<SubnetAndValidatorContextType | null>(null);

export default function SubnetAndValidatorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [validatorsLoading, setValidatorsLoading] = useState(true);
  const { subnets, loading: subnetsLoading, error } = useSubnets();

  useEffect(() => {
    const fetchValidators = async () => {
      setValidatorsLoading(true);
      try {
        const fetchedValidators = await loadValidators();
        setValidators(fetchedValidators);
      } catch (error) {
        console.error("Failed to load validators:", error);
      } finally {
        setValidatorsLoading(false);
      }
    };

    fetchValidators();
  }, []);

  const getSubnetById = (id: number) => {
    return subnets.find((subnet) => subnet.net_uid === id);
  };

  const getValidatorByHotkey = (hotkey: string) => {
    return validators.find((vali) => vali.hotkey === hotkey);
  };

  const loading = subnetsLoading || validatorsLoading;

  return (
    <SubnetAndValidatorContext.Provider
      value={{
        subnets,
        validators,
        loading,
        getSubnetById,
        getValidatorByHotkey,
      }}
    >
      {children}
    </SubnetAndValidatorContext.Provider>
  );
}

// Custom hook to consume the context
export const useSubnetAndValidators = () => {
  const context = useContext(SubnetAndValidatorContext);
  if (!context) {
    throw new Error(
      "useSubnetAndValidators must be used within a SubnetAndValidatorProvider",
    );
  }
  return context;
};
