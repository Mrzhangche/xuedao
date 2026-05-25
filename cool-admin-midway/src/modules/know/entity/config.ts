import { BaseEntity, transformerJson } from '../../base/entity/base';
import { Column, Entity } from 'typeorm';

/**
 * 知识库配置
 */
@Entity('know_config')
export class KnowConfigEntity extends BaseEntity {
  @Column({ comment: '名称' })
  name: string;

  @Column({ comment: '描述', nullable: true })
  description: string;

  @Column({ comment: '类型' })
  type: string;

  @Column({ comment: '功能' })
  func: string;

  @Column({ comment: '配置', type: 'json', transformer: transformerJson })
  options: any;
}
