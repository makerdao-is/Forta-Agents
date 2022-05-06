import {
  Finding, getEthersProvider, HandleTransaction, HandleBlock,
  TransactionEvent, BlockEvent
} from "forta-agent";
import { providers } from "ethers";
import provideDenyFunctionHandler from "./deny.function";
import provideRelyFunctionHandler from "./rely.function";
import TimeTracker from "./time.tracker";
import provideBigQueuedPriceDeviationHandler from "./big.queued.price.deviation";
import { providePriceUpdateCheckHandler, providePriceLateChecker } from "./price.update.check";
import AddressesFetcher from "./addresses.fetcher";
import { CHAIN_LOG, EVENTS_ABIS } from "./utils";
import { parseBytes32String } from "ethers/lib/utils";

let FETCHER: AddressesFetcher = new AddressesFetcher(getEthersProvider(), CHAIN_LOG);
let TIMETRACKER: TimeTracker = new TimeTracker();

export const initialize = (fetcher: AddressesFetcher) => async () => {
  // fetch OSM addresses from the ChainLog contract.
  await fetcher.getOsmAddresses("latest");
};

export const provideHandleTxn = (fetcher: AddressesFetcher,
  timeTracker: TimeTracker): HandleTransaction => {
  const bigDeviationNextPriceHandler: HandleTransaction = provideBigQueuedPriceDeviationHandler(fetcher);
  const denyFunctionHandler: HandleTransaction = provideDenyFunctionHandler(fetcher);
  const relyFunctionHandler: HandleTransaction = provideRelyFunctionHandler(fetcher);
  const priceUpdateCheckHandler: HandleTransaction = providePriceUpdateCheckHandler(timeTracker);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    // Update the contracts list.
    txEvent.filterLog(EVENTS_ABIS, CHAIN_LOG).forEach((log) => {
      const contractName = parseBytes32String(log.args[0]);
      if (contractName.startsWith("PIP_")) fetcher.updateAddresses(log.name, log.args.flat());
    });

    findings = findings.concat(await bigDeviationNextPriceHandler(txEvent));
    findings = findings.concat(await denyFunctionHandler(txEvent));
    findings = findings.concat(await relyFunctionHandler(txEvent));
    findings = findings.concat(await priceUpdateCheckHandler(txEvent));

    return findings;
  };
};

export const provideHandleBlock = (provider: providers.Provider,
  fetcher: AddressesFetcher,
  timeTracker: TimeTracker): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const handler: HandleBlock = providePriceLateChecker(provider, fetcher, timeTracker);
    return handler(blockEvent);
  };
};

export default {
  initialize: initialize(FETCHER),
  handleTransaction: provideHandleTxn(FETCHER, TIMETRACKER),
  handleBlock: provideHandleBlock(getEthersProvider(), FETCHER, TIMETRACKER),
};
