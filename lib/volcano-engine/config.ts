import { VolcanoEngineConfig } from './types';

type VolcanoEngineEnv = {
  VOLCANO_ENGINE_API_KEY?: string;
  VOLCANO_ENGINE_API_URL?: string;
  VOLCANO_ENGINE_TEXT_MODEL?: string;
  VOLCANO_ENGINE_IMAGE_MODEL?: string;
  VOLCANO_ENGINE_VIDEO_MODEL?: string;
};

const DEFAULT_TEXT_MODEL = 'doubao-seed-2-0-lite-260428';
const DEFAULT_IMAGE_MODEL = 'doubao-seedream-5-0-260128';
const DEFAULT_VIDEO_MODEL = 'doubao-seedance-1-0-pro-250528';

export function resolveVolcanoEngineConfig(
  env: VolcanoEngineEnv = process.env as VolcanoEngineEnv
): VolcanoEngineConfig {
  return {
    apiKey: env.VOLCANO_ENGINE_API_KEY || '',
    apiUrl:
      env.VOLCANO_ENGINE_API_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    textModel: env.VOLCANO_ENGINE_TEXT_MODEL || DEFAULT_TEXT_MODEL,
    imageModel: env.VOLCANO_ENGINE_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
    videoModel: env.VOLCANO_ENGINE_VIDEO_MODEL || DEFAULT_VIDEO_MODEL,
  };
}

export const volcanoEngineConfig: VolcanoEngineConfig = resolveVolcanoEngineConfig();

export const defaultVolcanoModels = {
  text: DEFAULT_TEXT_MODEL,
  image: DEFAULT_IMAGE_MODEL,
  video: DEFAULT_VIDEO_MODEL,
};

export function validateConfig(): void {
  if (!volcanoEngineConfig.apiKey) {
    throw new Error('VOLCANO_ENGINE_API_KEY is not configured');
  }
  if (!volcanoEngineConfig.apiUrl) {
    throw new Error('VOLCANO_ENGINE_API_URL is not configured');
  }
}

// 获取模型配置
export function getModelConfig() {
  return {
    text: volcanoEngineConfig.textModel,
    image: volcanoEngineConfig.imageModel,
    video: volcanoEngineConfig.videoModel,
  };
}

export function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${volcanoEngineConfig.apiKey}`,
  };
}
