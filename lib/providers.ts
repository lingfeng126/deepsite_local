export const PROVIDERS = {
  "fireworks-ai": {
    name: "Fireworks AI",
    max_tokens: 131_000,
    id: "fireworks-ai",
  },
  nebius: {
    name: "Nebius AI Studio",
    max_tokens: 131_000,
    id: "nebius",
  },
  sambanova: {
    name: "SambaNova",
    max_tokens: 32_000,
    id: "sambanova",
  },
  novita: {
    name: "NovitaAI",
    max_tokens: 16_000,
    id: "novita",
  },
  hyperbolic: {
    name: "Hyperbolic",
    max_tokens: 131_000,
    id: "hyperbolic",
  },
  together: {
    name: "Together AI",
    max_tokens: 128_000,
    id: "together",
  },
};

// Custom model interface
export interface CustomModel {
  id: string;
  value: string;
  label: string;
  baseUrl: string;
  token: string;
  maxTokens: number;
  isCustom: true;
  isNew?: boolean;
  isThinker?: boolean;
}

// Utility functions for managing custom models
export const getCustomModels = (): CustomModel[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('custom-models');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCustomModel = (model: Omit<CustomModel, 'id' | 'isCustom'>): CustomModel => {
  const customModel: CustomModel = {
    ...model,
    id: `custom-${Date.now()}`,
    isCustom: true,
  };
  
  const customModels = getCustomModels();
  customModels.push(customModel);
  localStorage.setItem('custom-models', JSON.stringify(customModels));
  
  return customModel;
};

export const deleteCustomModel = (id: string): void => {
  const customModels = getCustomModels().filter(model => model.id !== id);
  localStorage.setItem('custom-models', JSON.stringify(customModels));
};

export const getAllModels = () => {
  return [...MODELS, ...getCustomModels()];
};

export const MODELS = [
  {
    value: "deepseek-chat",
    label: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1",
    token: process.env.DEEPSEEK_TOKEN || "",
    maxTokens: 131_072,
  },
  {
    value: "deepseek-reasoner",
    label: "DeepSeek-reasoner",
    baseUrl: "https://api.deepseek.com/v1",
    token: process.env.DEEPSEEK_TOKEN || "",
    isThinker: true,
    maxTokens: 131_072,
  },
];
