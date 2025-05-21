import { HTTP_VALIDATOR_LIST } from "@/constants/shared";
import { ValidatorInfo } from "@/types";

export const loadValidators = async (): Promise<ValidatorInfo[]> => {
  const res = await fetch(HTTP_VALIDATOR_LIST, {
    method: "GET",
  });

  if (res.status !== 200) return [];

  const data = await res.json();
  const list = Object.entries(data).map(([hotkey, value]: [string, any]) => {
    // Ensure value has expected structure and map 'subnets' to 'netuids'
    const validatorData = value as {
      name: string;
      url: string;
      description: string;
      signature: string;
      subnets?: number[]; // Optional as it might be missing in some entries
    };

    return {
      hotkey,
      name: validatorData.name || "",
      url: validatorData.url || "",
      description: validatorData.description || "",
      signature: validatorData.signature || "",
      netuids: validatorData.subnets || [], // Map subnets to netuids, default to empty array
    } as ValidatorInfo;
  });
  return list;
};
