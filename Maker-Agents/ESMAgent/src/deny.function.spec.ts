import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import provideDenyFunctionHandler from "./deny.function";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { utils } from "ethers";
import { DENY_FUNCTION_SIG } from "./utils";

const ESM_ADDRESS = createAddress("0x1");
const ADMIN = createAddress("0x2");
const denyIface = new utils.Interface([DENY_FUNCTION_SIG]);

export const createFinding = (to: string, address: string) => {
  return Finding.fromObject({
    name: "Maker ESM DENY Function",
    description: "DENY Function is called",
    alertId: "MakerDAO-ESM-D",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    protocol: "Maker",
    metadata: {
      contract: to,
      deniedAddress: address,
    },
  });
};

describe("Rely Function Agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    const mockFetcher: any = {
      esmAddress: ESM_ADDRESS,
      getEsmAddress: jest.fn(),
    };
    handleTransaction = provideDenyFunctionHandler(mockFetcher);
  });

  it("should return a finding", async () => {
    const _from = createAddress("0x123");
    const _to = ESM_ADDRESS;
    const _input: string = denyIface.encodeFunctionData("deny", [ADMIN]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setTimestamp(1).setTo(_to).addTraces({
      to: _to,
      from: _from,
      input: _input,
    });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([createFinding(_to, ADMIN)]);
  });

  it("should return an empty finding when deny is called on a different contract", async () => {
    const _from = createAddress("0x123");
    const _to = createAddress("0x321"); // BAD ADDRESS
    const _input: string = denyIface.encodeFunctionData("deny", [ADMIN]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTimestamp(3)
      .addTraces({
        to: _to,
        from: _from,
        input: _input,
      });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
