import { BigNumber } from "@ethersproject/bignumber";

export const hexToUint8Array = (hexString: string): Uint8Array => {
  if (hexString.startsWith("0x")) {
    hexString = hexString.slice(2);
  }
  return Uint8Array.from(Buffer.from(hexString, "hex"));
};

export const rayToBps = (ray: BigNumber): BigNumber => {
  return ray.div(BigNumber.from("10").pow(23));
}
