import { BlockEvent } from "forta-agent";

export const topOfHourThreshold = 10; // first N minutes of the hour

export default class TimeTracker {
  private hour: number; // keeps track of the hour
  private blocksPerTop: number;
  private gotHourBlock: boolean;
  private hourBlock: number; // block number at top of hour
  private firstHour: number;
  functionWasCalled: boolean;
  findingReported: boolean;
  logSearched: boolean;

  constructor() {
    this.hour = -1;
    this.firstHour = -1;
    this.functionWasCalled = false;
    this.findingReported = false;
    this.logSearched = false;
    this.gotHourBlock = false;
    this.hourBlock = 0;
    this.blocksPerTop = Math.floor(topOfHourThreshold * 60 / 13); // initially guess 13s blocks
  }

  isDifferentHour(timestamp: number): boolean {
    if (this.hour === -1) {
      return false;
    }
    return this.hour !== this.getHour(timestamp);
  }

  updateLogSearched(status: boolean): void {
    this.logSearched = status;
  }

  updateFunctionWasCalled(status: boolean): void {
    this.functionWasCalled = status;
  }

  updateFindingReport(status: boolean): void {
    this.findingReported = status;
  }

  getHour(timestamp: number): number {
    const nd = new Date(timestamp * 1000); //x1000 to convert from seconds to milliseconds
    return nd.getUTCHours();
  }

  getMinute(timestamp: number): number {
    var d = new Date(timestamp * 1000); //x1000 to convert from seconds to milliseconds
    return d.getUTCMinutes();
  }

  inTopOfHour(timestamp: number): boolean {
    const minutes = this.getMinute(timestamp);
    return minutes < topOfHourThreshold;
  }

  isFirstHour(timestamp: number): boolean {
    return this.firstHour === -1 || this.firstHour === this.getHour(timestamp);
  }

  getTopOfHourBlock(blockEvent: BlockEvent): number {
    // assert(!this.isFirstHour(blockEvent.block.timestamp));
    if (this.gotHourBlock) {
      // refresh estimate
      this.blocksPerTop = blockEvent.block.number - this.hourBlock;
    }
    // 5 blocks is about a minute
    return blockEvent.block.number - (this.blocksPerTop + 5);
  }

  updateHour(blockEvent: BlockEvent): void {
    const timestamp = blockEvent.block.timestamp;
    if (this.isDifferentHour(timestamp)) {
      this.gotHourBlock = false;
      if (this.inTopOfHour(timestamp)) {
        this.gotHourBlock = true;
        this.hourBlock = blockEvent.block.number;
      }
      this.updateFindingReport(false);
      this.updateFunctionWasCalled(false);
      this.updateLogSearched(false);
    }

    this.hour = this.getHour(timestamp);
    if (this.firstHour === -1) {
      this.firstHour = this.hour;
    }
  }
}
