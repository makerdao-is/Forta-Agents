import { Finding } from "forta-agent";
import TimeTracker from "./time.tracker";
import { providePriceUpdateCheckHandler, providePriceLateChecker, createFinding } from "./price.update.check";

import { Agent, runBlock, TestTransactionEvent, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { MockEthersProvider } from "forta-agent-tools/lib/tests";
import { MEGAPOKER_CONTRACT, pokeFunctionSelector } from "./utils";
import { TCONTRACTS as CONTRACTS } from "./addresses.fetcher.spec";

const previousHourForActivatingAgent = 1467018381;
const lessThanTenMinutes = 1467021981; // "Mon, 27 Jun 2016 10:06:21 GMT"
const greaterThanTenMinutes = 1467022981; // "Mon, 27 Jun 2016 10:23:01 GMT"
const differentHour = 1467032181; // "Mon, 27 Jun 2016 12:56:21 GMT"
const mockProvider: MockEthersProvider = new MockEthersProvider();

mockProvider.addFilteredLogs({
  fromBlock: -51, toBlock: -1,
  topics: [pokeFunctionSelector]
}, []);

describe("Poker Method", () => {
  let timeTracker: TimeTracker;
  let agent: Agent;
  let mockFetcher: any;
  let updateAddresses = jest.fn();
  let getOsmAddresses = jest.fn();

  beforeEach(() => {
    mockFetcher = {
      osmContracts: CONTRACTS,
      getOsmAddresses,
      updateAddresses,
    };
    timeTracker = new TimeTracker();
    agent = {
      handleBlock: providePriceLateChecker(mockProvider as any, mockFetcher, timeTracker),
      handleTransaction: providePriceUpdateCheckHandler(timeTracker),
    };
  });

  it("should returns empty findings in the first hour", async () => {
    let findings: Finding[] = [];

    findings = findings.concat(await runBlock(
      agent,
      new TestBlockEvent().setTimestamp(greaterThanTenMinutes),
      new TestTransactionEvent().setTimestamp(greaterThanTenMinutes)));

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings in the first hour", async () => {
    let findings: Finding[] = [];

    findings = findings.concat(await runBlock(
      agent,
      new TestBlockEvent().setTimestamp(lessThanTenMinutes),
      new TestTransactionEvent().setTimestamp(lessThanTenMinutes)));
    findings = findings.concat(await runBlock(
      agent,
      new TestBlockEvent().setTimestamp(greaterThanTenMinutes),
      new TestTransactionEvent().setTimestamp(greaterThanTenMinutes)));

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings if the function was correctly called", async () => {
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(previousHourForActivatingAgent);
    const blockEvent1 = new TestBlockEvent().setTimestamp(previousHourForActivatingAgent);
    const txEvent2 = new TestTransactionEvent()
      .addTraces({ to: MEGAPOKER_CONTRACT, input: pokeFunctionSelector })
      .setTimestamp(lessThanTenMinutes);
    const blockEvent2 = new TestBlockEvent().setTimestamp(lessThanTenMinutes);
    const txEvent3 = new TestTransactionEvent().setTimestamp(greaterThanTenMinutes);
    const blockEvent3 = new TestBlockEvent().setTimestamp(greaterThanTenMinutes);

    findings = findings.concat(await runBlock(agent, blockEvent1, txEvent1));
    findings = findings.concat(await runBlock(agent, blockEvent2, txEvent2));
    findings = findings.concat(await runBlock(agent, blockEvent3, txEvent3));

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding if the function is not called in that hour", async () => {
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(previousHourForActivatingAgent);
    const blockEvent1 = new TestBlockEvent().setTimestamp(previousHourForActivatingAgent);
    const txEvent2 = new TestTransactionEvent().setTimestamp(lessThanTenMinutes);
    const blockEvent2 = new TestBlockEvent().setTimestamp(lessThanTenMinutes);
    const txEvent3 = new TestTransactionEvent().setTimestamp(greaterThanTenMinutes);
    const blockEvent3 = new TestBlockEvent().setTimestamp(greaterThanTenMinutes);

    findings = findings.concat(await runBlock(agent, blockEvent1, txEvent1));
    findings = findings.concat(await runBlock(agent, blockEvent2, txEvent2));
    findings = findings.concat(await runBlock(agent, blockEvent3, txEvent3));

    expect(findings).toStrictEqual([createFinding()]);
  });

  it("should returns a finding if the function was not called in the first ten minutes", async () => {
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(previousHourForActivatingAgent);
    const blockEvent1 = new TestBlockEvent().setTimestamp(previousHourForActivatingAgent);
    const txEvent2 = new TestTransactionEvent().setTimestamp(lessThanTenMinutes);
    const blockEvent2 = new TestBlockEvent().setTimestamp(lessThanTenMinutes);
    const txEvent3 = new TestTransactionEvent()
      .addTraces({ to: MEGAPOKER_CONTRACT, input: pokeFunctionSelector })
      .setTimestamp(greaterThanTenMinutes);
    const blockEvent3 = new TestBlockEvent().setTimestamp(greaterThanTenMinutes);

    findings = findings.concat(await runBlock(agent, blockEvent1, txEvent1));
    findings = findings.concat(await runBlock(agent, blockEvent2, txEvent2));
    findings = findings.concat(await runBlock(agent, blockEvent3, txEvent3));

    expect(findings).toStrictEqual([createFinding()]);
  });

  it("should returns a finding for every hour in which function is not called in the first ten minutes", async () => {
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(previousHourForActivatingAgent);
    const blockEvent1 = new TestBlockEvent().setTimestamp(previousHourForActivatingAgent);
    const txEvent2 = new TestTransactionEvent().setTimestamp(lessThanTenMinutes);
    const blockEvent2 = new TestBlockEvent().setTimestamp(lessThanTenMinutes);
    const txEvent3 = new TestTransactionEvent()
      .addTraces({ to: MEGAPOKER_CONTRACT, input: pokeFunctionSelector })
      .setTimestamp(greaterThanTenMinutes);
    const blockEvent3 = new TestBlockEvent().setTimestamp(greaterThanTenMinutes);
    const txEvent4 = new TestTransactionEvent().setTimestamp(differentHour);
    const blockEvent4 = new TestBlockEvent().setTimestamp(differentHour);

    findings = findings.concat(await runBlock(agent, blockEvent1, txEvent1));
    findings = findings.concat(await runBlock(agent, blockEvent2, txEvent2));
    findings = findings.concat(await runBlock(agent, blockEvent3, txEvent3));
    findings = findings.concat(await runBlock(agent, blockEvent4, txEvent4));

    expect(findings).toStrictEqual([createFinding(), createFinding()]);
  });

  it("should report findings only once per hour", async () => {
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(previousHourForActivatingAgent);
    const blockEvent1 = new TestBlockEvent().setTimestamp(previousHourForActivatingAgent);
    const txEvent2 = new TestTransactionEvent().setTimestamp(greaterThanTenMinutes);
    const blockEvent2 = new TestBlockEvent().setTimestamp(greaterThanTenMinutes);
    const txEvent3 = new TestTransactionEvent().setTimestamp(greaterThanTenMinutes);
    const blockEvent3 = new TestBlockEvent().setTimestamp(greaterThanTenMinutes);

    findings = findings.concat(await runBlock(agent, blockEvent1, txEvent1));
    findings = findings.concat(await runBlock(agent, blockEvent2, txEvent2));
    findings = findings.concat(await runBlock(agent, blockEvent3, txEvent3));

    expect(findings).toStrictEqual([createFinding()]);
  });
});
