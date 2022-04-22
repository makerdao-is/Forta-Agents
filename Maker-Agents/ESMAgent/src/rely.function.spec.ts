import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import provideRelyFunctionHandler from "./rely.function";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { utils } from "ethers";
import { RELY_FUNCTION_SIG } from "./utils";

const ESM_ADDRESS = createAddress("0x1");
const ADMIN = createAddress("0x2");
const relyIface = new utils.Interface([RELY_FUNCTION_SIG]);

export const createFinding = (to: string, address: string) => {
  return Finding.fromObject({
    name: "Maker ESM Contract RELY Function",
    description: "RELY Function is called",
    alertId: "MakerDAO-ESM-R",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    protocol: "Maker",
    metadata: {
      contract: to,
      reliedAddress: address,
    },
  });
};

describe("ESM Rely Function Agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    const mockFetcher: any = {
      esmAddress: ESM_ADDRESS,
      getEsmAddress: jest.fn(),
    };
    handleTransaction = provideRelyFunctionHandler(mockFetcher);
  });

  it("should return a finding", async () => {
    const _from = createAddress("0x123");
    const _to = ESM_ADDRESS;
    const _input: string = relyIface.encodeFunctionData("rely", [ADMIN]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setTimestamp(1).setTo(_to).addTraces({
      to: _to,
      from: _from,
      input: _input,
    });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([createFinding(_to, ADMIN)]);
  });

  it("should return an empty finding when the call is not in an ESM contract", async () => {
    const _from = createAddress("0x123");
    const _to = createAddress("0x321"); // BAD ADDRESS
    const _input: string = relyIface.encodeFunctionData("rely", [ADMIN]);

    const txEvent: TransactionEvent = new TestTransactionEvent().setTimestamp(3).addTraces({
      to: _to,
      from: _from,
      input: _input,
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
