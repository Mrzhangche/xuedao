import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * 数据源
 */
@Entity('know_data_source')
export class KnowDataSourceEntity extends BaseEntity {
  @Column({ comment: '名称' })
  title: string;

  @Column({ comment: '来源 0-自定义 1-文件 2-链接', default: 0 })
  from: number;

  @Index()
  @Column({ comment: '知识库ID' })
  typeId: number;

  @Column({ comment: '状态 0-准备中 1-已就绪', default: 0 })
  status: number;

  @Column({ comment: '内容', type: 'text', nullable: true })
  content: string;

  @Column({ comment: '配置', type: 'json', nullable: true })
  config: {
    [key: string]: any;
  };
}
