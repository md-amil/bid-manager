import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AdjustmentLog } from "src/schemas/log.schema";

@Injectable()
export class AdjustmentLogService {
  private readonly logger = new Logger(AdjustmentLogService.name);

  constructor(
    @InjectModel(AdjustmentLog.name) private logModel: Model<AdjustmentLog>,
  ) {

  }

  async saveLogs(logs: AdjustmentLog[]) {
    await this.logModel.insertMany(logs)
  }

  createLog(log: Partial<AdjustmentLog>) {
    const logEntry = new this.logModel(log);
    return logEntry.save();
  }

  getLogsBy(filter:{scopeId?:string,campaignId?:string}, limit:number=10){
    return this.logModel.find(filter).sort({ createdAt: -1 }).limit(limit).exec();
  }

  getLogsByCampaign(campaignId: string, scopeId: string) {
    return this.logModel.find({ campaignId, scopeId }).sort({ createdAt: -1 }).exec();
  }

  getLogsByScope(scopeId: string) {
    return this.logModel.find({ scopeId }).sort({ createdAt: -1 }).exec();
  }

  async deleteLogsByCampaign(campaignId: string, scopeId: string) {
    const result = await this.logModel.deleteMany({ campaignId, scopeId }).exec();
    this.logger.log(`Deleted ${result.deletedCount} logs for campaign ${campaignId}`);
    return result;
  }

  async deleteLogsByScope(scopeId: string) {
    const result = await this.logModel.deleteMany({ scopeId }).exec();
    this.logger.log(`Deleted ${result.deletedCount} logs for scope ${scopeId}`);
    return result;
  }
}