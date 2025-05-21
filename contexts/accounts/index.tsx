"use client";
import React, { useReducer, useContext, useEffect, useCallback } from "react";
import { PROXY_TRUSTED_STAKE, UNIT } from "@/constants/shared";
import { useApi } from "../api";

type State = {
  balance: number;
  loading: boolean;
  proxied: boolean;
};

type ProxyItem = {
  delegate: string;
  proxyType: string;
  delay: number;
};

const initialState: State = {
  balance: 0,
  loading: false,
  proxied: false,
};

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case "LOAD":
      return { ...state, loading: true };
    case "SET_BALANCE":
      return { ...state, balance: action.payload };
    case "SET_PROXIED":
      return { ...state, proxied: action.payload };
    case "READY":
      return { ...state, loading: false };
    case "LOADED":
      return { ...state, loading: false };
    default:
      throw new Error(`Unknown type: ${action.type}`);
  }
};

const defaultValue = {
  state: initialState,
  fetchInfo: (_api: any, _addr: string) => {},
};

const AccountContext = React.createContext(defaultValue);

export const AccountContextProvider = (props: any) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    state: { api, currentAccount, apiState },
  } = useApi();

  // Use a ref to track if we're on the client side
  const isClient = React.useRef(false);

  // Set isClient to true after component mount
  useEffect(() => {
    isClient.current = true;
  }, []);

  const fetchUserBalance = useCallback(async (apiInstance: any, address: string) => {
    if (!apiInstance || !address) return 0;
    try {
      if (!apiInstance.isReady || !apiInstance.query || !apiInstance.query.system) {
        console.warn("API not fully initialized or missing system module for fetchUserBalance");
        return 0;
      }
      const res = await apiInstance.query.system.account(address);
      if (res.isEmpty) return 0;
      const { data } = res.toJSON();
      return data.free / UNIT;
    } catch (error) {
      console.error("Error fetching user balance:", error);
      return 0;
    }
  }, [/* UNIT is a constant, no need to list if defined outside component scope and doesn't change */]);

  const fetchIsProxied = useCallback(async (apiInstance: any, address: string) => {
    if (!apiInstance || !address) return false;
    try {
      if (!apiInstance.isReady || !apiInstance.query || !apiInstance.query.proxy) {
        console.warn("API not fully initialized or missing proxy module for fetchIsProxied");
        return false;
      }
      const res = await apiInstance.query.proxy.proxies(address);
      if (res.isEmpty) return false;

      const data = res.toJSON();
      if (data.length !== 2) return false;

      const delegates = data[0] as ProxyItem[];
      if (delegates.length === 0) return false;

      const delegate = delegates.find(
        (d) => d.proxyType === "Staking" && d.delegate === PROXY_TRUSTED_STAKE,
      );
      return delegate !== undefined;
    } catch (error) {
      console.error("Error fetching proxy status:", error);
      return false;
    }
  }, [/* PROXY_TRUSTED_STAKE is a constant */]);

  const fetchInfo = useCallback(async (apiInstance: any, addr: string) => {
    if (!apiInstance || !addr) {
      console.warn("Cannot fetch account info: API instance or address is missing");
      dispatch({ type: "LOADED" });
      return;
    }
    if (!apiInstance.isReady) {
      console.warn("API is not ready for fetchInfo. Waiting for initialization...");
      dispatch({ type: "LOADED" }); 
      return;
    }

    dispatch({ type: "LOAD" });

    try {
      const balanceResult = await fetchUserBalance(apiInstance, addr);
      dispatch({
        type: "SET_BALANCE",
        payload: balanceResult,
      });

      const proxiedResult = await fetchIsProxied(apiInstance, addr);
      dispatch({ type: "SET_PROXIED", payload: proxiedResult });

      dispatch({ type: "LOADED" });
    } catch (error) {
      console.error("Error fetching account info in fetchInfo:", error);
      dispatch({ type: "LOADED" });
    }
  }, [dispatch, fetchUserBalance, fetchIsProxied]);

  useEffect(() => {
    if (isClient.current && apiState === "READY" && api && currentAccount && currentAccount.address) {
      fetchInfo(api, currentAccount.address);
    } else {
      // Optional: Log why fetchInfo isn't called for easier debugging
      if (isClient.current) { // Only log if client-side rendering has begun
        // console.log("AccountContext: Skipping fetchInfo. Conditions not met:", {
        //   apiState,
        //   apiReady: !!api?.isReady,
        //   currentAccountExists: !!currentAccount?.address
        // });
        // Reset balance/proxied if account disconnects or API is not ready, to prevent stale data display
        if (!currentAccount || apiState !== "READY") {
          dispatch({ type: "SET_BALANCE", payload: 0 });
          dispatch({ type: "SET_PROXIED", payload: false });
        }
      }
    }
  }, [api, currentAccount, apiState, fetchInfo]); // Added apiState and fetchInfo

  return (
    <AccountContext.Provider
      value={{
        state,
        fetchInfo,
      }}
    >
      {props.children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => useContext(AccountContext);
