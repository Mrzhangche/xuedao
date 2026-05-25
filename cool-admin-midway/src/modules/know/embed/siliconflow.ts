import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';
import axios from 'axios';

interface SiliconflowEmbeddingsParams extends EmbeddingsParams {
  apiKey: string;
  model: string;
}

/**
 * 硅基流动向量化模型
 */
export class SiliconflowEmbeddings extends Embeddings {
  apiKey: string;
  model: string;
  constructor(options: SiliconflowEmbeddingsParams) {
    super(options);
    this.apiKey = options.apiKey;
    this.model = options.model;
  }
  async embedDocuments(documents: string[]): Promise<number[][]> {
    const result = await Promise.all(
      documents.map(async document => {
        const result = await this.request(document);
        return result[0].embedding;
      })
    );
    return result;
  }

  async embedQuery(document: string): Promise<number[]> {
    const result = await this.request(document);
    return result[0].embedding;
  }

  async request(input: string) {
    const result = await axios.post(
      'https://api.siliconflow.cn/v1/embeddings',
      {
        input,
        model: this.model,
        encoding_format: 'float',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );
    return result.data.data;
  }
}
