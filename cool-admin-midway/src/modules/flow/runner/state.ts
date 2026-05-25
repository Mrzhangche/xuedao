import { Annotation, StateGraphArgs } from '@langchain/langgraph';
import { FlowContext } from './context';

/**
 * 状态
 */
export const FlowState = Annotation.Root({
  context: Annotation<FlowContext>,
});
