import { BaseEntity } from '../../../base/entity/base';
import { Column, Entity, Index } from 'typeorm';

/**
 * 节点
 */
@Index(['name', 'typeId'], { unique: true })
@Entity('know_graph_node')
export class KnowGraphNodeEntity extends BaseEntity {
  @Column({ comment: '名称' })
  name: string;

  @Index()
  @Column({ comment: '类型' })
  type: string;

  @Index()
  @Column({ comment: '知识库ID' })
  typeId: number;

  @Index()
  @Column({ comment: '分块ID' })
  chunkId: string;

  @Index()
  @Column({ comment: '资源ID' })
  sourceId: number;
}
