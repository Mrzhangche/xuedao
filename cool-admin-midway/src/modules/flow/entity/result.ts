import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity } from 'typeorm';
import { FlowNode } from '../runner/node';

/**
 * 流程结果
 */
@Entity('flow_result')
export class FlowResultEntity extends BaseEntity {
  @Column({ comment: '请求ID' })
  requestId: string;

  @Column({
    comment: '节点ID',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  node: FlowNode;

  @Column({ comment: '节点类型' })
  nodeType: string;

  @Column({
    comment: '输入',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  input: any;

  @Column({
    comment: '输出',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  output: any;

  @Column({ comment: '持续时间(毫秒)', default: 0 })
  duration: number;
}
