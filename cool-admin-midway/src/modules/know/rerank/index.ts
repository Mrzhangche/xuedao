import { KnowRerankCohere } from './cohere';
import { KnowRerankAliyun } from './aliyun';
import { KnowRerankSiliconflow } from './siliconflow';

/**
 * rerank模型，为了使结果更加准确，需要对结果进行重新排序
 */
export const RerankModel = {
  // cohere
  cohere: KnowRerankCohere,
  // aliyun
  aliyun: KnowRerankAliyun,
  // siliconflow
  siliconflow: KnowRerankSiliconflow,
};

// Rerank类型键
export type RerankType = keyof typeof RerankModel;
