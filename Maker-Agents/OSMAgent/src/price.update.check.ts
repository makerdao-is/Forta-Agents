import { type Log } from "@ethersproject/abstract-provider";
import { providers } from "ethers";
import {
  Finding, HandleTransaction, TransactionEvent, HandleBlock, BlockEvent,
  FindingSeverity, FindingType
} from "forta-agent";
import TimeTracker from "./time.tracker";
import { MEGAPOKER_CONTRACT, POKE_FUNCTION_SIG } from "./utils";
import { formatBytes32String } from "ethers/lib/utils";
import type AddressesFetcher from "./addresses.fetcher";

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
      !timeTracker.functionWasCalled &&
      timeTracker.inTopOfHour(timestamp) &&
      txEvent.filterFunction(POKE_FUNCTION_SIG, MEGAPOKER_CONTRACT).length !== 0
    ) {
      timeTracker.updateFunctionWasCalled(true);
    }

    return [];
  };
};

export function providePriceLateChecker(
  provider: providers.Provider,
  fetcher: AddressesFetcher, timeTracker: TimeTracker): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];
    const timestamp = blockEvent.block.timestamp;

    timeTracker.updateHour(blockEvent);

    if (timeTracker.inTopOfHour(timestamp) || timeTracker.isFirstHour(timestamp)) return [];

    if (!timeTracker.logSearched) {
      // Might have missed the poke due to reorg
      timeTracker.updateLogSearched(true);

      const PIP_ETH = fetcher.osmContracts.get(formatBytes32String("PIP_ETH"));
      const fromBlock = timeTracker.getTopOfHourBlock(blockEvent);
      const toBlock = blockEvent.block.number - 1;

      const filter = {
        address: PIP_ETH,
        fromBlock: fromBlock,
        toBlock: toBlock,
        topics: [ // keccak 'poke()'
          "0x1817835800000000000000000000000000000000000000000000000000000000"
        ]
      };

      // MockEthersProvider doesn't offer getLogs() TODO
      let logs: Array<Log> = [];
      if (typeof provider.getLogs === "function")
        logs = await provider.getLogs(filter);
      const called = logs.length > 0;
      console.log(`Search poke in ${PIP_ETH} in ${fromBlock}-${toBlock} ` +
        `-> ${called} (otherwise ${timeTracker.functionWasCalled})`);
      if (called) timeTracker.updateFunctionWasCalled(true);
    }

    if (!timeTracker.functionWasCalled && !timeTracker.findingReported) {
      timeTracker.updateFindingReport(true);
      findings.push(createFinding());
    }

    return findings;
  };
};
