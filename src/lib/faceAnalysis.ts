import * as tf from '@tensorflow/tfjs';

export interface FaceFeatures {
  landmarks: number[][];
  faceWidth: number;
  faceHeight: number;
  jawlineWidth: number;
  foreheadWidth: number;
  cheekboneWidth: number;
  chinWidth: number;
}

export interface AnalysisResult {
  faceShape: FaceShapeType;
  skinTone: SkinToneType;
  skinUndertone: SkinUndertoneType;
  confidence: number;
}

export type FaceShapeType = 'oval' | 'round' | 'square' | 'heart' | 'long' | 'diamond' | 'triangle';
export type SkinToneType = 'cool' | 'warm' | 'neutral';
export type SkinUndertoneType = 'pink' | 'yellow' | 'olive';

export class FaceAnalysisEngine {
  private model: tf.LayersModel | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      // 在生产环境中，这里会加载训练好的模型
      // this.model = await tf.loadLayersModel('/models/face_analysis_model.json');
      this.initialized = true;
    } catch (error) {
      console.warn('模型加载失败，使用规则算法:', error);
      this.initialized = true;
    }
  }

  async analyzeImage(imageData: string): Promise<AnalysisResult> {
    await this.initialize();
    
    const img = await this.loadImage(imageData);
    const features = await this.extractFaceFeatures(img);
    const skinAnalysis = await this.analyzeSkinTone(img);
    
    const faceShape = this.classifyFaceShape(features);
    
    return {
      faceShape: faceShape.type,
      skinTone: skinAnalysis.tone,
      skinUndertone: skinAnalysis.undertone,
      confidence: Math.min(faceShape.confidence, skinAnalysis.confidence)
    };
  }

  private async loadImage(imageData: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageData;
    });
  }

  private async extractFaceFeatures(img: HTMLImageElement): Promise<FaceFeatures> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // 模拟面部特征点检测 (实际项目中会使用MediaPipe)
    const mockLandmarks = this.generateMockLandmarks(img.width, img.height);
    
    return {
      landmarks: mockLandmarks,
      faceWidth: img.width * 0.6,
      faceHeight: img.height * 0.8,
      jawlineWidth: img.width * 0.5,
      foreheadWidth: img.width * 0.55,
      cheekboneWidth: img.width * 0.58,
      chinWidth: img.width * 0.35
    };
  }

  private generateMockLandmarks(width: number, height: number): number[][] {
    // 68个面部关键点的模拟数据
    const landmarks: number[][] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    // 下颌线 (0-16)
    for (let i = 0; i < 17; i++) {
      const angle = (i / 16) * Math.PI - Math.PI / 2;
      landmarks.push([
        centerX + Math.cos(angle) * width * 0.25,
        centerY + Math.sin(angle) * height * 0.35 + height * 0.1
      ]);
    }
    
    // 右眉毛 (17-21)
    for (let i = 0; i < 5; i++) {
      landmarks.push([
        centerX - width * 0.15 + (i * width * 0.08),
        centerY - height * 0.15
      ]);
    }
    
    // 左眉毛 (22-26)
    for (let i = 0; i < 5; i++) {
      landmarks.push([
        centerX + width * 0.02 + (i * width * 0.08),
        centerY - height * 0.15
      ]);
    }
    
    // 鼻子等其他特征点...
    // 为简化起见，这里只生成关键的几个区域
    
    return landmarks;
  }

  private classifyFaceShape(features: FaceFeatures): { type: FaceShapeType; confidence: number } {
    const { faceWidth, faceHeight, jawlineWidth, foreheadWidth, cheekboneWidth } = features;
    
    // 计算关键比例
    const aspectRatio = faceHeight / faceWidth;
    const jawToForeheadRatio = jawlineWidth / foreheadWidth;
    const cheekboneToJawRatio = cheekboneWidth / jawlineWidth;
    const cheekboneToForeheadRatio = cheekboneWidth / foreheadWidth;
    
    const confidence = 0.85; // 基础置信度
    
    // 脸型分类规则
    if (aspectRatio > 1.5) {
      // 长脸
      if (jawToForeheadRatio > 0.8) {
        return { type: 'long', confidence };
      }
    }
    
    if (aspectRatio < 1.2) {
      // 宽脸
      if (jawToForeheadRatio > 0.9 && cheekboneToJawRatio < 1.1) {
        return { type: 'round', confidence };
      }
      if (jawToForeheadRatio > 0.85) {
        return { type: 'square', confidence };
      }
    }
    
    if (jawToForeheadRatio < 0.75) {
      // 上宽下窄
      if (cheekboneToForeheadRatio > 0.9) {
        return { type: 'heart', confidence };
      }
      return { type: 'triangle', confidence };
    }
    
    if (cheekboneToJawRatio > 1.15 && cheekboneToForeheadRatio > 1.1) {
      return { type: 'diamond', confidence };
    }
    
    // 默认椭圆形
    return { type: 'oval', confidence: 0.7 };
  }

  private async analyzeSkinTone(img: HTMLImageElement): Promise<{
    tone: SkinToneType;
    undertone: SkinUndertoneType;
    confidence: number;
  }> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // 采样面部中心区域的颜色
    const centerX = img.width / 2;
    const centerY = img.height / 2;
    const sampleSize = Math.min(img.width, img.height) * 0.1;
    
    const imageData = ctx.getImageData(
      centerX - sampleSize / 2,
      centerY - sampleSize / 2,
      sampleSize,
      sampleSize
    );
    
    // 计算平均颜色
    let totalR = 0, totalG = 0, totalB = 0;
    const pixelCount = imageData.data.length / 4;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      totalR += imageData.data[i];
      totalG += imageData.data[i + 1];
      totalB += imageData.data[i + 2];
    }
    
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;
    
    // 转换到LAB色彩空间进行分析
    const lab = this.rgbToLab(avgR, avgG, avgB);
    
    // 分析肤色冷暖
    let tone: SkinToneType = 'neutral';
    let undertone: SkinUndertoneType = 'yellow';
    
    // 基于a*和b*值判断冷暖
    if (lab.a > 0 && lab.b > 0) {
      tone = 'warm';
      undertone = avgR > avgG + 10 ? 'pink' : 'yellow';
    } else if (lab.a < 0) {
      tone = 'cool';
      undertone = avgB > avgR + 5 ? 'pink' : 'olive';
    }
    
    return {
      tone,
      undertone,
      confidence: 0.8
    };
  }

  private rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
    // 简化的RGB到LAB转换
    // 实际项目中应使用更精确的色彩空间转换算法
    
    // 先转到XYZ
    let rNorm = r / 255;
    let gNorm = g / 255;
    let bNorm = b / 255;
    
    // Gamma correction
    rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
    gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
    bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;
    
    // XYZ
    const x = (rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375) * 100;
    const y = (rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750) * 100;
    const z = (rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041) * 100;
    
    // LAB
    const xn = 95.047, yn = 100.000, zn = 108.883; // D65 illuminant
    
    const fx = x / xn > 0.008856 ? Math.pow(x / xn, 1/3) : (7.787 * (x / xn) + 16/116);
    const fy = y / yn > 0.008856 ? Math.pow(y / yn, 1/3) : (7.787 * (y / yn) + 16/116);
    const fz = z / zn > 0.008856 ? Math.pow(z / zn, 1/3) : (7.787 * (z / zn) + 16/116);
    
    const l = (116 * fy) - 16;
    const a = 500 * (fx - fy);
    const b_val = 200 * (fy - fz);
    
    return { l, a, b: b_val };
  }
}

// 单例模式
export const faceAnalysisEngine = new FaceAnalysisEngine();