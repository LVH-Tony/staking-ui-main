import { useState, useEffect, useRef } from "react";
import { Subnet, SubnetRawData, SubnetIdentity } from "@/types";

const BASE_URL = "https://api.app.trustedstake.ai";
const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

interface SubnetsResponse {
  data: SubnetRawData[];
  count: number;
}

interface SubnetIdentitiesResponse {
  data: SubnetIdentity[];
  count: number;
}

const convertRaoToTao = (raoAmount: string): number => {
  return parseFloat(raoAmount) / 1e9;
};

const convertRawToAlpha = (rawAmount: string): number => {
  return parseFloat(rawAmount) / 1e9;
};

// Helper to ensure URLs are properly formatted
const formatUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;

  // Trim whitespace
  url = url.trim();

  // If empty after trimming, return undefined
  if (!url) return undefined;

  // If URL doesn't start with http:// or https://, add https://
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  // Remove localhost if it's incorrectly prepended
  url = url.replace(/https?:\/\/localhost:[0-9]+\/(https?:\/\/)?/i, "https://");
  url = url.replace(/https?:\/\/localhost:[0-9]+\//i, "https://");

  // Handle cases where www is missing the protocol
  if (url.startsWith("https://www.")) {
    return url;
  } else if (
    url.startsWith("https://") &&
    !url.startsWith("https://www.") &&
    url.includes("www.")
  ) {
    return url.replace("www.", "");
  }

  return url;
};

// Helper to determine if a discord value is a URL or a username
const formatDiscordValue = (
  value: string | undefined,
): { url?: string; username?: string } => {
  if (!value) return {};

  value = value.trim();
  if (!value) return {};

  // Check if this is already a valid URL
  if (/^https?:\/\//i.test(value)) {
    // It's a URL, let's clean it up
    return { url: formatUrl(value) };
  }

  // Check if it starts with @ or has a discord.com domain
  if (value.startsWith("@")) {
    // It's a username with an @ prefix
    return { username: value };
  }

  // Check if it has common Discord URL patterns but missing protocol
  if (
    value.includes("discord.com/") ||
    value.includes("discord.gg/") ||
    value.includes("discordapp.com/")
  ) {
    // It's a URL without proper protocol
    return { url: formatUrl(value) };
  }

  // If it contains / or . but doesn't look like a Discord URL
  if (value.includes("/") || value.includes(".")) {
    // Probably some other URL
    return { url: formatUrl(value) };
  }

  // If we get here, it's likely just a username without @
  return { username: value.startsWith("@") ? value : "@" + value };
};

export const useSubnets = () => {
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isInitialLoad = useRef(true);

  const fetchSubnets = async (silentRefresh = false) => {
    try {
      // Only set loading to true on initial load or non-silent refreshes
      if (!silentRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      // Fetch data from both endpoints in parallel
      const [subnetsResponse, identitiesResponse] = await Promise.all([
        fetch(`${BASE_URL}/subnets`),
        fetch(`${BASE_URL}/subnet_identities`),
      ]);

      if (!subnetsResponse.ok) throw new Error("Failed to fetch subnets");
      if (!identitiesResponse.ok)
        throw new Error("Failed to fetch subnet identities");

      // Parse both responses
      const subnetsResult: SubnetsResponse = await subnetsResponse.json();
      const identitiesResult: SubnetIdentitiesResponse =
        await identitiesResponse.json();

      // Create a map of subnet identities by net_uid for easier lookup
      const identitiesMap = new Map<number, SubnetIdentity>();
      identitiesResult.data.forEach((identity) => {
        identitiesMap.set(identity.net_uid, identity);
      });

      // Combine data from both endpoints
      const convertedSubnets = subnetsResult.data.map((subnet) => {
        // Look up the corresponding identity
        const identity = identitiesMap.get(subnet.net_uid);

        // Format URLs properly
        const imageUrl = formatUrl(identity?.subnet_url);
        const githubUrl = formatUrl(identity?.github_repo);

        // Handle Discord value specially
        const discordInfo = formatDiscordValue(identity?.discord);

        return {
          net_uid: subnet.net_uid,
          // Use identity name if available, otherwise fall back to subnet name or default
          name: identity?.subnet_name || subnet.name || "Unnamed Subnet",
          updated_at: subnet.updated_at || new Date().toISOString(),
          network_registered_at:
            subnet.network_registered_at?.toString() ||
            new Date().toISOString(),
          tempo: subnet.tempo || 0,
          emission: convertRaoToTao(subnet.emission?.toString() || "0"),
          tao_in_pool: convertRaoToTao(subnet.tao_in_pool?.toString() || "0"),
          alpha_in_pool: convertRawToAlpha(
            subnet.alpha_in_pool?.toString() || "0",
          ),
          alpha_staked: convertRawToAlpha(
            subnet.alpha_staked?.toString() || "0",
          ),
          tao_volume: convertRaoToTao(subnet.tao_volume?.toString() || "0"),
          symbol: subnet.symbol || "",
          // Add identity information with properly formatted URLs
          description: identity?.description || "",
          github: githubUrl || "",
          bittensor_id: subnet.symbol || "",
          owner: identity?.subnet_contact || "",
          hw_requirements: "",
          image_url: imageUrl || "",
          // Add additional identity fields that might be useful
          discord: discordInfo?.url || "",
          discord_username: discordInfo?.username || "",
          additional: identity?.additional || "",
          custom_display_name: undefined as string | undefined,
        };
      });

      // Sort subnets by netuid in ascending order
      const sortedSubnets = convertedSubnets.sort(
        (a, b) => a.net_uid - b.net_uid,
      );

      // Special case for subnet 0 (Root)
      const rootSubnet = sortedSubnets.find((subnet) => subnet.net_uid === 0);
      if (rootSubnet) {
        rootSubnet.custom_display_name = "Root";
      }

      setSubnets(sortedSubnets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      isInitialLoad.current = false;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSubnets();

    // Set up refresh interval with silent refresh
    const intervalId = setInterval(() => {
      fetchSubnets(true);
    }, REFRESH_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return { subnets, loading, error, isRefreshing };
};
