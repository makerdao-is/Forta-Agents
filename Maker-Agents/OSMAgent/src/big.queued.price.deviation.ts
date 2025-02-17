import { BigNumber } from "ethers";
import { parseBytes32String } from "ethers/lib/utils";
import { TransactionEvent, Trace, HandleTransaction, Finding, FindingType, FindingSeverity } from "forta-agent";
import AddressesFetcher from "./addresses.fetcher";
import { PEEK_FUNCTION_SELECTOR, LOG_VALUE_EVENT_SIGNATURE, PEEK_ABI } from "./utils";

export const createFinding = (contractName: string, contractAddress: string, currentPrice: any, queuedPrice: any): Finding => {
  const cur = BigNumber.from(currentPrice);
  const que = BigNumber.from(queuedPrice);
  return Finding.fromObject({
    name: "MakerDAO OSM Contract Big Enqueued Price Deviation",
    description: "The new enqueued price deviate more than 6% from current price",
    alertId: "MakerDAO-OSM-1",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Info,
    protocol: "Maker",
    metadata: {
      contractName: contractName,
      contractAddress: contractAddress,
      currentPrice: currentPrice.toString(),
      queuedPrice: queuedPrice.toString(),
      change: que.mul(10000).div(cur).sub(10000).toString()
    },
  });
};

const correctFunctionCalled = (trace: Trace): boolean => {
  return trace.action.input === PEEK_FUNCTION_SELECTOR;
};

const callWasSuccessful = (trace: Trace): boolean => {
  const results = PEEK_ABI.decodeFunctionResult("peek", trace.result.output);
  return results[1];
};

const decodeNextValue = (trace: Trace): BigNumber => {
  const results = PEEK_ABI.decodeFunctionResult("peek", trace.result.output);
  return BigNumber.from(results[0]);
};

const getNextValuesForOSM = (contractAddress: string, traces: Trace[]) =>
  traces
    .filter(
      (trace) => trace.action.from === contractAddress && correctFunctionCalled(trace) && callWasSuccessful(trace)
    )
    .map(decodeNextValue);

const getCurrentValues = (contractAddress: string, txEvent: TransactionEvent) => {
  return txEvent.filterLog(LOG_VALUE_EVENT_SIGNATURE, contractAddress).map((log) => BigNumber.from(log.args[0]));
};

const needToReport = (currentValue: BigNumber, nextValue: BigNumber): boolean => {
  const bigDeviation: BigNumber = BigNumber.from(6).mul(currentValue).div(BigNumber.from(100));
  return currentValue.sub(nextValue).abs().gt(bigDeviation);
};

const checkOSMContract = (name: string, contractAddress: string, txEvent: TransactionEvent): Finding | null => {
  const currentValues: BigNumber[] = getCurrentValues(contractAddress, txEvent);
  const nextValues: BigNumber[] = getNextValuesForOSM(contractAddress, txEvent.traces);

  const lessLength: number = Math.min(currentValues.length, nextValues.length);
  for (let i = 0; i < lessLength; i++) {
    if (needToReport(currentValues[i], nextValues[i])) {
      return createFinding(name, contractAddress.toLowerCase(), currentValues[i], nextValues[i]);
    }
  }

  return null;
};

export default function provideBigQueuedPriceDeviationHandler(fetcher: AddressesFetcher): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    fetcher.osmContracts.forEach(function(addr, key) {
      const name = parseBytes32String(key);
      const finding: Finding | null = checkOSMContract(name, addr, txEvent);
      if (finding !== null) {
        findings.push(finding);
      }
    });
    return findings;
  };
}
