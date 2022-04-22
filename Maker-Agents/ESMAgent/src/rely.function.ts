import { TransactionDescription } from "ethers/lib/utils";
import { Finding, TransactionEvent, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import AddressFetcher from "./address.fetcher";
import { RELY_FUNCTION_SIG } from "./utils";

export const createFinding = (metadata: { [key: string]: any } | undefined): Finding => {
  return Finding.fromObject({
    name: "Maker ESM Contract RELY Function",
    description: "RELY Function is called",
    alertId: "MakerDAO-ESM-R",
    protocol: "Maker",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata,
  });
};

export default function provideRelyFunctionHandler(fetcher: AddressFetcher): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.filterFunction([RELY_FUNCTION_SIG], fetcher.esmAddress).forEach((desc: TransactionDescription) => {
      const metadata = {
        contract: txEvent.to,
        reliedAddress: desc.args[0].toLowerCase(),
      };
      findings.push(createFinding(metadata));
    });

    return findings;
  };
}
