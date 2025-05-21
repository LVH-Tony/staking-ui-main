"use client";
import React, { useReducer, useContext, useEffect } from "react";
import jsonrpc from "@polkadot/types/interfaces/jsonrpc";
import { DefinitionRpcExt } from "@polkadot/types/types";
import { ApiPromise, WsProvider } from "@polkadot/api";

import { Signer } from "@polkadot/api/types";
import {
  RPC_URL,
  APP_NAME,
  LOCAL_STORAGE_ACCOUNTS,
  LOCAL_STORAGE_CURRENT_ACCOUNT,
  LOCAL_STORAGE_API_STATE,
} from "@/constants/shared";

///
// Initial state for `useReducer`

type API_STATE = "CONNECT_INIT" | "CONNECTING" | "READY" | "ERROR";

type KEYRING_STATE = "LOADING" | "READY" | "ERROR";

type State = {
  socket: string;
  jsonrpc: Record<string, Record<string, DefinitionRpcExt>>;
  keyringState: KEYRING_STATE | null;
  api: any;
  apiError: any;
  apiState: API_STATE | null;
  accounts: any[];
  currentAccount: any;
  currentSigner: Signer | undefined;
};

const initialState: State = {
  // These are the states
  socket: RPC_URL,
  jsonrpc: { ...jsonrpc },
  keyringState: null,
  api: null,
  apiError: null,
  apiState: null,
  currentAccount: null,
  currentSigner: undefined,
  accounts: [],
};

///
// Reducer function for `useReducer`

const reducer = (state: any, action: { type: string; payload: any }) => {
  switch (action.type) {
    case "CONNECT_INIT":
      localStorage.setItem(LOCAL_STORAGE_API_STATE, "CONNECT_INIT");
      return { ...state, apiState: "CONNECT_INIT" };
    case "CONNECT":
      localStorage.setItem(LOCAL_STORAGE_API_STATE, "CONNECTING");
      return { ...state, api: action.payload, apiState: "CONNECTING" };
    case "CONNECT_SUCCESS":
      localStorage.setItem(LOCAL_STORAGE_API_STATE, "READY");
      return { ...state, apiState: "READY" };
    case "CONNECT_ERROR":
      localStorage.setItem(LOCAL_STORAGE_API_STATE, "ERROR");
      return { ...state, apiState: "ERROR", apiError: action.payload };
    case "LOAD_KEYRING":
      return { ...state, keyringState: "LOADING" };
    case "KEYRING_ERROR":
      return { ...state, keyring: null, keyringState: "ERROR" };
    case "SET_CURRENT_ACCOUNT":
      localStorage.setItem(
        LOCAL_STORAGE_CURRENT_ACCOUNT,
        JSON.stringify(action.payload)
      );
      return { ...state, currentAccount: action.payload };
    case "SET_CURRENT_SIGNER":
      return { ...state, currentSigner: action.payload } as State;
    case "SET_ACCOUNTS":
      localStorage.setItem(
        LOCAL_STORAGE_ACCOUNTS,
        JSON.stringify(action.payload)
      );
      return { ...state, accounts: action.payload, keyringState: "READY" };
    case "DISCONNECT":
      localStorage.removeItem(LOCAL_STORAGE_API_STATE);
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_ACCOUNT);
      return { ...initialState };
    case "RESET":
      localStorage.removeItem(LOCAL_STORAGE_API_STATE);
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_ACCOUNT);
      return { ...initialState };
    case "LOAD_API_STATE":
      return { ...state, apiState: action.payload };
    default:
      throw new Error(`Unknown type: ${action.type}`);
  }
};

///
// Connecting to the Substrate node

const connect = (state: any, dispatch: any) => {
  const { apiState, socket, jsonrpc } = state;
  // We only want this function to be performed once
  if (apiState) return;

  dispatch({ type: "CONNECT_INIT" });

  try {
    console.log("Connecting to Bittensor network at:", socket);
    const provider = new WsProvider(socket);

    // Configure API with specific modules needed for Bittensor
    const _api = new ApiPromise({
      provider,
      rpc: jsonrpc,
      noInitWarn: true, // Suppress initialization warnings
    });

    // Set listeners for disconnection and reconnection event.
    _api.on("connected", () => {
      console.log("Connected to Bittensor network");
      dispatch({ type: "CONNECT", payload: _api });
    });

    _api.on("ready", () => {
      console.log("API is ready");
      // Check if required modules are available
      if (!_api.query.system || !_api.query.proxy) {
        console.warn(
          "API is missing required modules. Some functionality may not work."
        );
      }
      dispatch({ type: "CONNECT_SUCCESS" });
    });

    _api.on("error", (err) => {
      console.error("API connection error:", err);
      dispatch({ type: "CONNECT_ERROR", payload: err });
    });

    _api.on("disconnected", () => {
      console.log("Disconnected from Bittensor network");
    });
  } catch (error) {
    console.error("Error initializing API:", error);
    dispatch({ type: "CONNECT_ERROR", payload: error });
  }
};

// Loading accounts from dev and polkadot-js extension
const loadAccounts = async (dispatch: any) => {
  dispatch({ type: "LOAD_KEYRING" });

  try {
    let allAccounts = [];
    const accounts = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS);

    if (accounts) {
      allAccounts = JSON.parse(accounts);
    }
    if (!accounts || allAccounts.length === 0) {
      const extensionDapp = await import("@polkadot/extension-dapp");
      const { web3Accounts, web3Enable } = extensionDapp;
      const extensions = await web3Enable(APP_NAME);
      if (extensions.length === 0) {
        dispatch({ type: "KEYRING_ERROR" });
        return;
      }

      allAccounts = await web3Accounts();
      allAccounts = allAccounts.map(({ address, meta }) => ({
        address,
        meta: { ...meta, name: `${meta.name} (${meta.source})` },
      }));
      localStorage.setItem(LOCAL_STORAGE_ACCOUNTS, JSON.stringify(allAccounts));
    }

    // default select an account
    const firstAccount = allAccounts?.[0];
    if (firstAccount) {
      dispatch({ type: "SET_CURRENT_ACCOUNT", payload: firstAccount });
    }

    dispatch({ type: "SET_ACCOUNTS", payload: allAccounts });
  } catch {
    dispatch({ type: "KEYRING_ERROR" });
  }
};

const disconnect = (dispatch: any) => {
  localStorage.removeItem(LOCAL_STORAGE_CURRENT_ACCOUNT);
  localStorage.removeItem(LOCAL_STORAGE_ACCOUNTS);
  dispatch({ type: "DISCONNECT" });
};

const defaultValue = {
  state: initialState,
  connectWallet: () => {},
  setCurrentAccount: (acct: any) => {},
  disconnectWallet: () => {},
  resetApiState: () => {},
};

const ApiContext = React.createContext(defaultValue);

export const ApiContextProvider = (props: any) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load data from localStorage after component mount (client-side only)
  useEffect(() => {
    // Load API state
    const savedApiState = localStorage.getItem(
      LOCAL_STORAGE_API_STATE
    ) as API_STATE;
    if (savedApiState) {
      dispatch({ type: "LOAD_API_STATE", payload: savedApiState });
    }

    // Load current account
    const savedCurrentAccountString = localStorage.getItem(
      LOCAL_STORAGE_CURRENT_ACCOUNT
    );
    if (savedCurrentAccountString) {
      try {
        const parsedAccount = JSON.parse(savedCurrentAccountString);
        if (parsedAccount) {
          dispatch({ type: "SET_CURRENT_ACCOUNT", payload: parsedAccount });
        }
      } catch (error) {
        console.error("Error parsing saved account:", error);
        localStorage.removeItem(LOCAL_STORAGE_CURRENT_ACCOUNT);
      }
    }

    // Load accounts
    const savedAccountsString = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS);
    if (savedAccountsString) {
      try {
        const parsedAccounts = JSON.parse(savedAccountsString);
        // We dispatch SET_ACCOUNTS which also sets keyringState to READY.
        // If accounts are loaded from local storage, keyring is implicitly ready.
        dispatch({ type: "SET_ACCOUNTS", payload: parsedAccounts });
      } catch (error) {
        console.error("Error parsing saved accounts:", error);
        localStorage.removeItem(LOCAL_STORAGE_ACCOUNTS);
      }
    }
  }, [dispatch]);

  // Effect to attempt API connection if a current account was restored from localStorage 
  // and the API is not already connected or trying to connect.
  useEffect(() => {
    const { apiState, currentAccount } = state;
    // Only try to connect if a currentAccount is present (restored) and apiState is not yet initiated.
    // The connect() function itself has a guard: if (apiState) return;
    if (currentAccount && !apiState) { 
      connect(state, dispatch); 
    }
  }, [state.currentAccount, state.apiState, dispatch]);

  // Effect to load accounts from extension if API is ready and keyring hasn't been processed yet.
  useEffect(() => {
    const { apiState, keyringState, accounts } = state;
    // If API is ready, and keyring is not yet loaded/processed (keyringState is null),
    // or if there are no accounts loaded yet (e.g. from localStorage),
    // then attempt to load accounts from the extension.
    if (apiState === "READY" && (keyringState === null || accounts.length === 0)) {
      loadAccounts(dispatch);
    }
  }, [state.apiState, state.keyringState, state.accounts, dispatch]);

  useEffect(() => {
    const getInjector = async () => {
      const currentAccount = state.currentAccount;
      if (!currentAccount) return;

      try {
        const extensionDapp = await import("@polkadot/extension-dapp");
        const { web3Enable, web3FromSource } = extensionDapp;
        const extensions = await web3Enable(APP_NAME);
        if (extensions.length === 0) {
          dispatch({ type: "KEYRING_ERROR", payload: {} });
          return;
        }
        const injector = await web3FromSource(currentAccount.meta.source);
        dispatch({ type: "SET_CURRENT_SIGNER", payload: injector.signer });
      } catch {
        dispatch({ type: "KEYRING_ERROR", payload: {} });
      }
    };

    getInjector();
  }, [state.currentAccount]);

  function setCurrentAccount(acct: any) {
    dispatch({ type: "SET_CURRENT_ACCOUNT", payload: acct });
  }

  const connectWallet = () => connect(state, dispatch);

  const disconnectWallet = () => disconnect(dispatch);

  const resetApiState = () => {
    dispatch({ type: "RESET", payload: {} });
  };

  return (
    <ApiContext.Provider
      value={{
        state,
        connectWallet,
        setCurrentAccount,
        disconnectWallet,
        resetApiState,
      }}
    >
      {props.children}
    </ApiContext.Provider>
  );
};

export const useApi = () => useContext(ApiContext);

const apiContext = { ApiContextProvider, useApi };

export default apiContext;
