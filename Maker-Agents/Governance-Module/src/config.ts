import { BigNumber } from "ethers";

const CHAINLOG_CONTRACT: string = "0xda0ab1e0017debcd72be8599041a2aa3ba7e740f";
const SPELL_DEPLOYER: string = "0xC1E6d8136441FC66612Df3584007f7CB68765e5D";
const KNOWN_LIFTERS: string[] = ["0x8b4c184918947b52f615FC2aB350e092906b54CB"];
const MKR_THRESHOLD: BigNumber = BigNumber.from(40000);

export default {
  CHAINLOG_CONTRACT,
  SPELL_DEPLOYER,
  KNOWN_LIFTERS,
  MKR_THRESHOLD,
};
