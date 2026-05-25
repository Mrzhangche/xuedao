import { BaseEntity, transformerJson } from '../../../base/entity/base';
import { Column, Entity } from 'typeorm';

/**
 * 知识信息类型
 */
@Entity('know_data_type')
export class KnowDataTypeEntity extends BaseEntity {
  @Column({ comment: '名称' })
  name: string;

  @Column({ comment: '图标', nullable: true })
  icon: string;

  @Column({ comment: '集合ID', nullable: true })
  collectionId: string;

  @Column({ comment: '描述', nullable: true })
  description: string;

  @Column({ comment: 'embedding配置ID' })
  embedConfigId: number;

  @Column({
    comment: 'llm配置',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  llmOptions: {
    // 配置ID
    configId: string;
    // 供应商
    supplier: string;
    // 参数
    params: any;
    // 通用参数
    comm: any;
  };

  @Column({
    comment: 'embedding配置',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  embedOptions: any;

  @Column({ comment: '是否开启rerank 0-否 1-是', default: 0 })
  enableRerank: number;

  @Column({ comment: 'rerank配置ID', nullable: true })
  rerankConfigId: number;

  @Column({
    comment: 'rerank配置',
    type: 'json',
    transformer: transformerJson,
    nullable: true,
  })
  rerankOptions: any;

  @Column({ comment: '状态', dict: ['禁用', '启用'], default: 1 })
  enable: number;

  @Column({
    comment: '索引方式',
    dict: ['经济', '高质量', '知识图谱'],
    default: 1,
  })
  indexType: number;
}
