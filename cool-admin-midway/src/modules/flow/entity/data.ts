import { Column, Entity, Index } from 'typeorm';
import { BaseEntity, transformerJson } from '../../base/entity/base';

/**
 * 流程数据
 */
@Entity('flow_data')
export class FlowDataEntity extends BaseEntity {
  @Index()
  @Column({ comment: '流程ID' })
  flowId: number;

  @Index()
  @Column({ comment: '对象ID' })
  objectId: string;

  @Column({ comment: '数据', type: 'json', transformer: transformerJson })
  data: any;
}
