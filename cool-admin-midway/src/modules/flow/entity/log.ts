import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity } from 'typeorm';

/**
 * 流程日志
 */
@Entity('flow_log')
export class FlowLogEntity extends BaseEntity {
  @Column({ comment: '流程ID' })
  flowId: number;

  @Column({ comment: '类型 0-失败 1-成功 2-未知', default: 0 })
  type: number;

  @Column({
    comment: '传入参数',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  inputParams: any;

  @Column({
    comment: '结果',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  result: any;
}
