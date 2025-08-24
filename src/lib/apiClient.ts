export interface AnalyzeResponse {
  faceShape: string;
  skinTone: string;
  skinUndertone: string;
  confidence: number;
  recommendations: {
    colors: string[];
    patterns: string[];
    necklines: string[];
    hairColors: string[];
    bangs: string[];
    accessories: string[];
    makeupTips: string[];
  };
  timestamp: string;
}

export interface ProcessResponse {
  processedImage: string;
  options: Record<string, unknown>;
  timestamp: string;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';
  }

  async analyzeImage(imageData: string): Promise<AnalyzeResponse> {
    const response = await fetch(`${this.baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '分析请求失败');
    }

    return response.json();
  }

  async processImage(imageData: string, options: Record<string, unknown>): Promise<ProcessResponse> {
    const response = await fetch(`${this.baseUrl}/api/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData, options }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '图片处理请求失败');
    }

    return response.json();
  }

  // 批量分析（用于未来扩展）
  async batchAnalyze(images: string[]): Promise<AnalyzeResponse[]> {
    const promises = images.map(imageData => this.analyzeImage(imageData));
    return Promise.all(promises);
  }

  // 获取API状态
  async getStatus(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/api/analyze`);
    return response.json();
  }
}

export const apiClient = new ApiClient();