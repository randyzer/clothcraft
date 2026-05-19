import { volcanoEngineConfig, validateConfig, getHeaders } from './config';
import { 
  ImageGenerationRequest, 
  ImageGenerationResponse,
  VolcanoEngineError 
} from './types';

type ImageGenerationOptions = {
  size?: 'adaptive' | '1K' | '2K' | '4K';
  inputImages?: string[];
  model?: string;
  watermark?: boolean;
};

export function buildImageGenerationRequest(
  prompt: string,
  options?: ImageGenerationOptions
): ImageGenerationRequest {
  const model = options?.model || volcanoEngineConfig.imageModel || 'doubao-seedream-5-0-260128';
  const size = options?.size || 'adaptive';
  const images = options?.inputImages?.filter(Boolean);

  return {
    model,
    prompt,
    image: images && images.length > 0 ? images : undefined,
    sequential_image_generation: images && images.length > 1 ? 'disabled' : undefined,
    response_format: 'url',
    size,
    stream: false,
    watermark: options?.watermark !== undefined ? options.watermark : true,
  };
}

export async function generateImage(
  prompt: string,
  options?: ImageGenerationOptions
): Promise<ImageGenerationResponse> {
  validateConfig();

  const request = buildImageGenerationRequest(prompt, options);

  const response = await fetch(`${volcanoEngineConfig.apiUrl}/images/generations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error: VolcanoEngineError = await response.json();
    throw new Error(`Volcano Engine API error: ${error.error?.message || 'Unknown error'}`);
  }

  return response.json();
}

export async function generateImageFromText(
  prompt: string
): Promise<{
  url: string;
  revisedPrompt?: string;
}> {
  const response = await generateImage(prompt);
  
  if (!response.data || response.data.length === 0) {
    throw new Error('No image generated');
  }

  return {
    url: response.data[0].url,
    revisedPrompt: response.data[0].revised_prompt,
  };
}
