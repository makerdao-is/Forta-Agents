import { TransactionDescription } from "ethers/lib/utils";
import { Finding, TransactionEvent, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import AddressFetcher from "./address.fetcher";
import { DENY_FUNCTION_SIG } from "./utils";

export const createFinding = (metadata: { [key: string]: any } | undefined): Finding => {
  return Finding.fromObject({
    name: "Maker ESM DENY Function",
    description: "DENY Function is called",
    alertId: "MakerDAO-ESM-D",
    severity: FindingSeverity.Medium,
    protocol: "Maker",
    type: FindingType.Info,
    metadata,
  });
};

export default function provideDenyFunctionHandler(fetcher: AddressFetcher): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.filterFunction(DENY_FUNCTION_SIG, fetcher.esmAddress).forEach((desc: TransactionDescription) => {
      const metadata = {
        contract: txEvent.to,
        deniedAddress: desc.args[0].toLowerCase(),
      };
      findings.push(createFinding(metadata));
    });

    return findings;
  };
}
