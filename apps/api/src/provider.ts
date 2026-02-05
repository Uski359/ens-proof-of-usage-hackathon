import { FallbackProvider, JsonRpcProvider } from "ethers";

let cachedProvider: FallbackProvider | null = null;

export function getProvider(): FallbackProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const rpcUrl1 = process.env.RPC_URL_1;
  const rpcUrl2 = process.env.RPC_URL_2;
  if (!rpcUrl1 || !rpcUrl2) {
    const error = new Error("RPC_URL_1 and RPC_URL_2 are required to resolve ENS names.") as Error & {
      statusCode?: number;
      code?: string;
    };
    error.statusCode = 500;
    error.code = "RPC_URL_MISSING";
    throw error;
  }

  const p1 = new JsonRpcProvider(rpcUrl1);
  const p2 = new JsonRpcProvider(rpcUrl2);

  cachedProvider = new FallbackProvider(
    [
      { provider: p1, priority: 1, stallTimeout: 1000 },
      { provider: p2, priority: 2, stallTimeout: 1000 }
    ],
    1
  );

  return cachedProvider;
}
