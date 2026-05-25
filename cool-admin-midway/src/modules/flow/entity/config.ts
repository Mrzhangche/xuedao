import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity } from 'typeorm';

/**
 * 流程配置
 */
@Entity('flow_config')
export class FlowConfigEntity extends BaseEntity {
  @Column({ comment: '名称' })
  name: string;

  @Column({ comment: '描述', nullable: true })
  description: string;

  @Column({ comment: '类型' })
  type: string;

  @Column({ comment: '节点' })
  node: string;

  @Column({
    comment: '配置',
    type: 'json',
    transformer: transformerJson,
  })
  options: any;
}
