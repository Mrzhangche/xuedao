import { Job, IJob } from '@midwayjs/cron';
import { FORMAT, ILogger, Inject } from '@midwayjs/core';
import { FlowResultService } from '../service/result';
import { FlowLogService } from '../service/log';

/**
 * 流程结果定时任务
 */
@Job({
  cronTime: FORMAT.CRONTAB.EVERY_DAY,
  start: true,
})
export class FlowCleartJob implements IJob {
  @Inject()
  logger: ILogger;

  @Inject()
  flowResultService: FlowResultService;

  @Inject()
  flowLogService: FlowLogService;

  async onTick() {
    this.logger.info('清除流程定时任务开始执行');
    const startTime = Date.now();
    this.flowResultService.clear();
    this.flowLogService.clear();
    this.logger.info(`清除流程定时任务结束，耗时:${Date.now() - startTime}ms`);
  }
}
