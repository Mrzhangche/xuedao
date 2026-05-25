import { Config, Inject, Provide } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { KnowGraphNodeEntity } from '../../entity/graph/node';
import { KnowGraphRelationEntity } from '../../entity/graph/relation';
import { KnowDataTypeService } from '../data/type';
// import { LLMGraphTransformer } from '../../graph/llm';
// import { Document } from '@langchain/core/documents';
import { retryWithAsync } from '@midwayjs/core';
import { In } from 'typeorm';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Utils } from '../../../../comm/utils';

/**
 * 知识图谱服务
 */
@Provide()
export class KnowGraphService extends BaseService {
  @InjectEntityModel(KnowGraphNodeEntity)
  knowGraphNodeEntity: Repository<KnowGraphNodeEntity>;

  @InjectEntityModel(KnowGraphRelationEntity)
  knowGraphRelationEntity: Repository<KnowGraphRelationEntity>;

  @Inject()
  knowDataTypeService: KnowDataTypeService;

  @Config('module.know')
  knowConfig;

  @Inject()
  utils: Utils;

  /**
   * 重试保存
   * @param typeId
   * @param data
   */
  async retrySave(
    typeId: number,
    data: {
      // 类型ID
      typeId: number;
      // 分段ID
      chunkId: string;
      // 资源ID
      sourceId: number;
      // 文本
      text: string;
    }
  ) {
    const type = await this.knowDataTypeService.info(typeId);
    if (!type || type.indexType !== 2) {
      return;
    }
    const invokeNew = retryWithAsync(
      this.save.bind(this),
      this.knowConfig.retry,
      {
        retryInterval: this.knowConfig.retryInterval,
      }
    );
    try {
      await invokeNew(typeId, data);
    } catch (e) {}
  }

  /**
   * 保存
   * @param typeId
   * @param data
   */
  async save(
    typeId: number,
    data: {
      // 类型ID
      typeId: number;
      // 分段ID
      chunkId: string;
      // 资源ID
      sourceId: number;
      // 文本
      text: string;
    }
  ) {
    const genResult = await this.gen(typeId, data.text);
    const nodes = genResult.nodes;
    const relations = genResult.relations;
    // 先清除分段
    await this.clearByChunk(typeId, data.chunkId);
    // 保存节点
    for (const node of nodes) {
      // 先判断是否存在
      const exist = await this.knowGraphNodeEntity.findOneBy({
        typeId: data.typeId,
        name: node.id as string,
      });
      if (exist) {
        continue;
      }
      // 保存节点
      await this.knowGraphNodeEntity.save({
        typeId: data.typeId,
        name: node.id,
        type: node.type,
        chunkId: data.chunkId,
        sourceId: data.sourceId,
      });
    }
    // 保存关系
    await this.knowGraphRelationEntity.save(
      relations.map(item => {
        return {
          typeId: data.typeId,
          sourceName: item.sourceId,
          targetName: item.targetId,
          chunkId: data.chunkId,
          sourceId: data.sourceId,
          type: item.type,
        };
      })
    );
  }

  /**
   * 获取知识图谱
   * @param typeId 类型ID
   */
  async getGraph(typeId: number) {
    const nodes = await this.knowGraphNodeEntity
      .createQueryBuilder('a')
      .select('a.name', 'id')
      .select('a.name', 'name')
      .addSelect('a.type', 'type')
      .addSelect('a.chunkId', 'chunkId')
      .where('a.typeId = :typeId', { typeId })
      .getRawMany();
    const relations = await this.knowGraphRelationEntity
      .createQueryBuilder('b')
      .select('b.sourceName', 'source')
      .addSelect('b.targetName', 'target')
      .addSelect('b.type', 'type')
      .where('b.typeId = :typeId', { typeId })
      .getRawMany();
    return {
      nodes,
      relations,
    };
  }

  /**
   * 清除分段
   * @param typeId 类型ID
   * @param chunkId 分段ID
   */
  async clearByChunk(typeId: number, chunkId: string) {
    await this.knowGraphNodeEntity.delete({ typeId, chunkId });
    await this.knowGraphRelationEntity.delete({ typeId, chunkId });
  }

  /**
   * 清除资源
   * @param sourceId 资源ID
   */
  async clearBySource(sourceIds: number[]) {
    await this.knowGraphNodeEntity.delete({ sourceId: In(sourceIds) });
    await this.knowGraphRelationEntity.delete({ sourceId: In(sourceIds) });
  }

  /**
   * 生成知识图谱
   * @param typeId 类型ID
   * @param text 文本
   */
  async gen(typeId: number, text: string) {
    const model = await this.knowDataTypeService.getLLMModel(typeId);
    const format = `{
      "nodes": [
        {
          "id": "实体ID",
          "type": "实体类型"
        }
      ],
      "relations": [
        {
          "sourceId": "源节点ID",
          "type": "关系类型",
          "targetId": "目标节点ID"
        }
      ]
    }`;
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `
        # 知识图谱构建指南

        ## 1. 概述
        你的任务是从文本中提取结构化信息，以构建知识图谱。
        尽可能多地捕获文本中的信息，同时保持准确性。不要添加文本中未明确提及的任何信息。

        知识图谱包含：
        - **节点**：表示实体和概念
        - **关系**：表示实体或概念之间的连接

        ## 2. 节点标注
        - **一致性**：确保使用基础或基本类型作为节点标签
        - 例如，当识别到代表人的实体时，始终将其标记为"Person"，避免使用更具体的术语如"Mathematician"或"Scientist"
        - **节点ID**：不要使用整数作为节点ID。节点ID应该是文本中找到的名称或人类可读的标识符
        - 不能以链接作为节点ID
        - 节点尽可能简短，不能过长，控制在2~6个字符

        ## 3. 关系定义
        - 构建知识图谱时确保关系类型的一致性和通用性
        - 使用更通用和永恒的关系类型，而不是特定和临时的类型
        - 例如，使用"PROFESSOR"而不是"BECAME_PROFESSOR"
        - 确保使用通用且永恒的关系类型

        ## 4. 共指消解
        - **保持实体一致性**：提取实体时确保一致性
        - 如果一个实体（如"张三"）在文本中多次提及但以不同名称或代词（如"小张"、"他"）指代，始终使用该实体最完整的标识符
        - 在这个例子中，使用"张三"作为实体ID
        - 记住，知识图谱应该连贯且易于理解，因此保持实体引用的一致性至关重要

        ## 5. 输出格式
        请以单行压缩JSON格式返回结果，不包含任何换行符、回车符或多余空格。确保返回的是有效的JSON字符串，可以直接被解析。
        Output Minified JSON
        输出格式示例：
        {format}
        
        重要说明：
        1. 返回的JSON必须是单行的，不包含任何\n或\r字符
        2. 不要在JSON前后添加任何额外文本、代码块标记或解释
        3. 确保JSON使用双引号作为字符串分隔符，遵循标准JSON规范
        4. 确保返回的是纯JSON格式，不要添加markdown格式
      `,
      ],
      [
        'user',
        `
        文本：{text}
        `,
      ],
    ]);
    const chain = prompt.pipe(model);
    const result = await chain.invoke({ text, format });
    // 使用工具提取JSON，确保可靠地获取正确的JSON内容
    return this.utils.extractJSONFromText(result.content);
  }

  /**
   * 搜索
   * @param typeId 类型ID
   * @param chunkId 分段ID
   * @param level 层级
   * @param size 数量
   */
  async search(typeId: number, chunkId: string, level: number, size: number) {
    const visitedChunks = new Set([chunkId]);
    const currentLevelChunks = [chunkId];

    // 记录所有关系对
    const allRelations = new Map<string, string[]>();

    // 定义递归查询关系函数
    const findRelatedChunks = async (currentLevel: number) => {
      if (currentLevel > level || currentLevelChunks.length === 0) {
        return;
      }

      // 获取当前层级所有chunkId的节点
      const nodes = await this.knowGraphNodeEntity.find({
        where: {
          typeId,
          chunkId: In(currentLevelChunks),
        },
        select: ['name', 'chunkId'],
      });

      // 根据节点名称查找所有关系
      const nodeNames = nodes.map(node => node.name);
      if (nodeNames.length === 0) {
        return;
      }

      // 查找这些节点作为源或目标的所有关系
      const relations = await this.knowGraphRelationEntity.find({
        where: [
          { typeId, sourceName: In(nodeNames) },
          { typeId, targetName: In(nodeNames) },
        ],
      });

      // 获取下一层级的chunkId
      const nextLevelChunks = new Set<string>();

      // 查询所有关联节点的chunkId
      const relatedNodeNames = new Set<string>();
      relations.forEach(relation => {
        if (nodeNames.includes(relation.sourceName)) {
          relatedNodeNames.add(relation.targetName);
        }
        if (nodeNames.includes(relation.targetName)) {
          relatedNodeNames.add(relation.sourceName);
        }
      });

      // 查询关联节点的chunkId
      if (relatedNodeNames.size > 0) {
        const relatedNodes = await this.knowGraphNodeEntity.find({
          where: {
            typeId,
            name: In(Array.from(relatedNodeNames)),
          },
          select: ['name', 'chunkId'],
        });

        // 构建节点名称到chunkId的映射
        const nodeNameToChunkId = new Map<string, string>();
        nodes.forEach(node => {
          nodeNameToChunkId.set(node.name, node.chunkId);
        });
        relatedNodes.forEach(node => {
          nodeNameToChunkId.set(node.name, node.chunkId);
        });

        // 处理关系
        for (const relation of relations) {
          const sourceChunkId = nodeNameToChunkId.get(relation.sourceName);
          const targetChunkId = nodeNameToChunkId.get(relation.targetName);

          if (sourceChunkId && targetChunkId) {
            // 跳过当前chunkId自身关系
            if (sourceChunkId === chunkId && targetChunkId === chunkId) {
              continue;
            }

            // 记录关系
            const relationStr = relation.type;

            // 如果关系中至少有一个是传入的chunkId，则需要记录关系到关联的另一个chunkId
            if (sourceChunkId === chunkId) {
              if (targetChunkId !== chunkId) {
                // 确保目标不是传入的chunkId
                if (!allRelations.has(targetChunkId)) {
                  allRelations.set(targetChunkId, []);
                }
                // 避免重复添加相同的关系类型
                if (!allRelations.get(targetChunkId).includes(relationStr)) {
                  allRelations.get(targetChunkId).push(relationStr);
                }

                // 标记为已访问，并加入下一层级（如果未访问过）
                if (!visitedChunks.has(targetChunkId)) {
                  visitedChunks.add(targetChunkId);
                  nextLevelChunks.add(targetChunkId);
                }
              }
            } else if (targetChunkId === chunkId) {
              if (sourceChunkId !== chunkId) {
                // 确保源不是传入的chunkId
                if (!allRelations.has(sourceChunkId)) {
                  allRelations.set(sourceChunkId, []);
                }
                // 避免重复添加相同的关系类型
                if (!allRelations.get(sourceChunkId).includes(relationStr)) {
                  allRelations.get(sourceChunkId).push(relationStr);
                }

                // 标记为已访问，并加入下一层级（如果未访问过）
                if (!visitedChunks.has(sourceChunkId)) {
                  visitedChunks.add(sourceChunkId);
                  nextLevelChunks.add(sourceChunkId);
                }
              }
            } else if (currentLevel > 0) {
              // 处理非直接与原始chunkId相关的关系（间接关系）
              // 当前层级的节点与其他节点的关系
              if (
                currentLevelChunks.includes(sourceChunkId) &&
                targetChunkId !== chunkId
              ) {
                if (!allRelations.has(targetChunkId)) {
                  allRelations.set(targetChunkId, []);
                }
                // 避免重复添加相同的关系类型
                if (!allRelations.get(targetChunkId).includes(relationStr)) {
                  allRelations.get(targetChunkId).push(relationStr);
                }

                if (!visitedChunks.has(targetChunkId)) {
                  visitedChunks.add(targetChunkId);
                  nextLevelChunks.add(targetChunkId);
                }
              } else if (
                currentLevelChunks.includes(targetChunkId) &&
                sourceChunkId !== chunkId
              ) {
                if (!allRelations.has(sourceChunkId)) {
                  allRelations.set(sourceChunkId, []);
                }
                // 避免重复添加相同的关系类型
                if (!allRelations.get(sourceChunkId).includes(relationStr)) {
                  allRelations.get(sourceChunkId).push(relationStr);
                }

                if (!visitedChunks.has(sourceChunkId)) {
                  visitedChunks.add(sourceChunkId);
                  nextLevelChunks.add(sourceChunkId);
                }
              }
            }
          }
        }
      }

      // 继续查询下一层级
      const nextLevelArray = Array.from(nextLevelChunks);
      if (nextLevelArray.length > 0) {
        // 将下一层级的chunkId更新为当前层级
        currentLevelChunks.length = 0;
        currentLevelChunks.push(...nextLevelArray);
        await findRelatedChunks(currentLevel + 1);
      }
    };

    // 开始递归查询
    await findRelatedChunks(0);

    // 转换结果格式并排除传入的chunkId
    const finalResult: { chunkId: string; relations: string[] }[] = [];

    // 明确检查并确保不包含传入的chunkId
    for (const [relatedChunkId, relations] of allRelations.entries()) {
      // 严格确保chunkId不等于传入的chunkId
      if (
        relatedChunkId &&
        relatedChunkId !== chunkId &&
        relations &&
        relations.length > 0
      ) {
        // 对关系进行去重
        const uniqueRelations = [...new Set(relations)];

        finalResult.push({
          chunkId: relatedChunkId,
          relations: uniqueRelations,
        });
      }
    }

    // 如果指定了size，则限制返回结果的数量
    return size > 0 ? finalResult.slice(0, size) : finalResult;
  }
}
