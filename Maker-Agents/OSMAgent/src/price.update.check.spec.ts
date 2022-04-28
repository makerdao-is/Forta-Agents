import { Finding, HandleTransaction, HandleBlock } from "forta-agent";
import TimeTracker from "./time.tracker";
import { providePriceUpdateCheckHandler, providePriceLateChecker, createFinding } from "./price.update.check";

import { TestTransactionEvent, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { MEGAPOKER_CONTRACT } from "./utils";

const pokeFunctionSelector = "0x18178358";
const previousHourForActivatingAgent = 1467018381;
const lessThanTenMinutes = 1467021981; // "Mon, 27 Jun 2016 10:06:21 GMT"
const greaterThanTenMinutes = 1467022981; // "Mon, 27 Jun 2016 10:23:01 GMT"
const differentHour = 1467032181; // "Mon, 27 Jun 2016 12:56:21 GMT"

describe("Poker Method", () => {
  let timeTracker: TimeTracker;
  let handleBlock: HandleBlock;
  let handleTransaction: HandleTransaction;

  beforeEach(() => {
    timeTracker = new TimeTracker();
    handleBlock = providePriceLateChecker(timeTracker);
    handleTransaction = providePriceUpdateCheckHandler(timeTracker);
  });

  it("should returns empty findings in the first hour", async () => {
    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(greaterThanTenMinutes);
    const blockEvent = new TestBlockEvent().setTimestamp(greaterThanTenMinutes);

    findings = findings.concat(await handleTransaction(txEvent));
    findings = findings.concat(await handleBlock(blockEvent));

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings in the first hour", async () => {
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(lessThanTenMinutes);
    const blockEvent1 = new TestBlockEvent().setTimestamp(lessThanTenMinutes);
    const txEvent2 = new TestTransactionEvent().setTimestamp(greaterThanTenMinutes);
    const blockEvent2 = new TestBlockEvent().setTimestamp(greaterThanTenMinutes);

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleBlock(blockEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleBlock(blockEvent2));

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

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleBlock(blockEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleBlock(blockEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));
    findings = findings.concat(await handleBlock(blockEvent3));

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

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleBlock(blockEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleBlock(blockEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));
    findings = findings.concat(await handleBlock(blockEvent3));

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

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleBlock(blockEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleBlock(blockEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));
    findings = findings.concat(await handleBlock(blockEvent3));

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

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleBlock(blockEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleBlock(blockEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));
    findings = findings.concat(await handleBlock(blockEvent3));
    findings = findings.concat(await handleTransaction(txEvent4));
    findings = findings.concat(await handleBlock(blockEvent4));

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

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleBlock(blockEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleBlock(blockEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));
    findings = findings.concat(await handleBlock(blockEvent3));

    expect(findings).toStrictEqual([createFinding()]);
  });
});
