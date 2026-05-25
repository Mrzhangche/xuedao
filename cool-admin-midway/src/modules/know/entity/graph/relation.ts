import { BaseEntity } from '../../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 关系
 */
@Entity('know_graph_relation')
export class KnowGraphRelationEntity extends BaseEntity {
  @Index()
  @Column({ comment: '知识库ID' })
  typeId: number;

  @Index()
  @Column({ comment: '分块ID' })
  chunkId: string;

  @Index()
  @Column({ comment: '资源ID' })
  sourceId: number;

  @Index()
  @Column({ comment: '类型' })
  type: string;

  @Index()
  @Column({ comment: '源' })
  sourceName: string;

  @Index()
  @Column({ comment: '目标' })
  targetName: string;
}
