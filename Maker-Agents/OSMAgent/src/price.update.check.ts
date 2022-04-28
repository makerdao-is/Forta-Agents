import { Finding, HandleTransaction, TransactionEvent, HandleBlock, BlockEvent,
         FindingSeverity, FindingType } from "forta-agent";
import TimeTracker from "./time.tracker";
import { MEGAPOKER_CONTRACT, POKE_FUNCTION_SIG } from "./utils";

export const createFinding = (): Finding => {
  return Finding.fromObject({
    name: "Method not called within the first 10 minutes",
    description: "Poke() function not called within 10 minutes of the hour",
    alertId: "MakerDAO-OSM-4",
    severity: FindingSeverity.Critical,
    protocol: "Maker",
    type: FindingType.Info,
    metadata: {
      MegaPokerContract: MEGAPOKER_CONTRACT,
    },
  });
};

export function providePriceUpdateCheckHandler(timeTracker: TimeTracker): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const timestamp = txEvent.block.timestamp;

    if (
      timeTracker.isInFirstTenMins(timestamp) &&
      txEvent.filterFunction(POKE_FUNCTION_SIG, MEGAPOKER_CONTRACT).length !== 0
    ) {
      timeTracker.updateFunctionWasCalled(true);
    }

    return [];
  };
};

export function providePriceLateChecker(timeTracker: TimeTracker): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];
    const timestamp = blockEvent.block.timestamp;

    timeTracker.updateHour(timestamp);

    if (
      !timeTracker.isInFirstTenMins(timestamp) &&
      !timeTracker.isFirstHour(timestamp) &&
      !timeTracker.functionWasCalled &&
      !timeTracker.findingReported
    ) {
      timeTracker.updateFindingReport(true);
      findings.push(createFinding());
    }

    return findings;
  };
};
