import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';
import { FlowGraph } from '../runner/context';

/**
 * 流程信息
 */
@Entity('flow_info')
export class FlowInfoEntity extends BaseEntity {
  @Index()
  @Column({ comment: '名称' })
  name: string;

  @Index({ unique: true })
  @Column({ comment: '标签（可以根据标签调用）', nullable: true })
  label: string;

  @Column({ comment: '描述', nullable: true })
  description: string;

  @Column({ comment: '状态 0-禁用 1-禁用', default: 1 })
  status: number;

  @Column({ comment: '版本', default: 1 })
  version: number;

  @Column({
    comment: '草稿',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  draft: FlowGraph;

  @Column({
    comment: '数据',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  data: FlowGraph;

  @Column({ comment: '发布时间', nullable: true })
  releaseTime: Date;
}
