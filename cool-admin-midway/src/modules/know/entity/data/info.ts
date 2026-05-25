import { transformerJson, transformerTime } from '../../../base/entity/base';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * 知识信息
 */
@Entity('know_data_info')
export class KnowDataInfoEntity {
  @PrimaryColumn({ comment: 'ID' })
  id: string;

  @Index()
  @Column({ comment: '知识库ID' })
  typeId: number;

  @Index()
  @Column({ comment: '数据源ID', nullable: true })
  sourceId: number;

  @Column({ comment: '内容', type: 'text' })
  content: string;

  @Column({ comment: '来源 0-自定义 1-文件 2-链接', default: 0 })
  from: number;

  @Column({
    comment: '元数据',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  metadata: {
    [key: string]: any;
  };

  @Column({ comment: '状态 0-准备中 1-已就绪', default: 0 })
  status: number;

  @Column({ comment: '启用 0-禁用 1-启用', default: 1 })
  enable: number;

  @Index()
  @Column({
    comment: '创建时间',
    type: 'varchar',
    transformer: transformerTime,
  })
  createTime: Date;

  @Index()
  @Column({
    comment: '更新时间',
    type: 'varchar',
    transformer: transformerTime,
  })
  updateTime: Date;
}
