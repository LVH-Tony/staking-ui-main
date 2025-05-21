import { useApi } from "@/contexts/api";

export function useWallet() {
  const {
    state: { currentAccount },
  } = useApi();

  return {
    connected: !!currentAccount,
    address: currentAccount,
  };
}
