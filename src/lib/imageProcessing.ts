export interface ProcessingOptions {
  removeBackground?: boolean;
  hairColor?: string;
  makeup?: {
    lipstick?: string;
    eyeshadow?: string;
    blush?: string;
  };
  accessories?: {
    earrings?: string;
    necklace?: string;
  };
}

export class ImageProcessor {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  private ensureCanvas() {
    if (!this.canvas && typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
    return this.canvas && this.ctx;
  }

  async processImage(imageData: string, options: ProcessingOptions): Promise<string> {
    if (!this.ensureCanvas()) {
      throw new Error('Canvas not available in server environment');
    }
    
    const img = await this.loadImage(imageData);
    this.canvas!.width = img.width;
    this.canvas!.height = img.height;
    this.ctx!.drawImage(img, 0, 0);
    
    let processedImageData = this.ctx!.getImageData(0, 0, this.canvas!.width, this.canvas!.height);
    
    if (options.removeBackground) {
      processedImageData = await this.removeBackground(processedImageData);
    }
    
    if (options.hairColor) {
      processedImageData = await this.changeHairColor(processedImageData, options.hairColor);
    }
    
    if (options.makeup) {
      processedImageData = await this.applyMakeup(processedImageData, options.makeup);
    }
    
    if (options.accessories) {
      processedImageData = await this.addAccessories(processedImageData, options.accessories);
    }
    
    this.ctx!.putImageData(processedImageData, 0, 0);
    return this.canvas!.toDataURL('image/jpeg', 0.9);
  }

  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private async removeBackground(imageData: ImageData): Promise<ImageData> {
    // 简化的背景移除算法
    // 实际项目中会使用U²-Net或其他深度学习模型
    
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 检测肤色区域作为前景
    const skinMask = this.detectSkinPixels(data, width, height);
    
    // 基于肤色区域扩展前景区域
    const foregroundMask = this.expandForegroundRegion(skinMask, width, height);
    
    // 应用alpha通道
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      const maskIndex = y * width + x;
      
      if (!foregroundMask[maskIndex]) {
        data[i + 3] = 0; // 设置alpha为透明
      }
    }
    
    return imageData;
  }

  private detectSkinPixels(data: Uint8ClampedArray, width: number, height: number): boolean[] {
    const mask = new Array(width * height).fill(false);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 肤色检测算法 (YCbCr色彩空间)
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      const cb = -0.169 * r - 0.331 * g + 0.5 * b + 128;
      const cr = 0.5 * r - 0.419 * g - 0.081 * b + 128;
      
      // 肤色范围判断
      if (cr >= 133 && cr <= 173 && cb >= 77 && cb <= 127) {
        const pixelIndex = Math.floor(i / 4);
        mask[pixelIndex] = true;
      }
    }
    
    return mask;
  }

  private expandForegroundRegion(skinMask: boolean[], width: number, height: number): boolean[] {
    const expanded = [...skinMask];
    const expansionRadius = 20;
    
    // 简单的形态学膨胀操作
    for (let y = expansionRadius; y < height - expansionRadius; y++) {
      for (let x = expansionRadius; x < width - expansionRadius; x++) {
        const index = y * width + x;
        
        if (skinMask[index]) {
          // 膨胀操作
          for (let dy = -expansionRadius; dy <= expansionRadius; dy++) {
            for (let dx = -expansionRadius; dx <= expansionRadius; dx++) {
              const newIndex = (y + dy) * width + (x + dx);
              if (dx * dx + dy * dy <= expansionRadius * expansionRadius) {
                expanded[newIndex] = true;
              }
            }
          }
        }
      }
    }
    
    return expanded;
  }

  private async changeHairColor(imageData: ImageData, newColor: string): Promise<ImageData> {
    const data = imageData.data;
    const targetRgb = this.hexToRgb(newColor);
    
    // 检测头发区域 (基于位置和颜色)
    const hairMask = this.detectHairPixels(data, imageData.width, imageData.height);
    
    // 应用新颜色
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      
      if (hairMask[pixelIndex]) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // 保持明度，改变色相
        const hsl = this.rgbToHsl(r, g, b);
        const targetHsl = this.rgbToHsl(targetRgb.r, targetRgb.g, targetRgb.b);
        
        // 混合原始明度和目标色相、饱和度
        const newRgb = this.hslToRgb(targetHsl.h, targetHsl.s, hsl.l);
        
        data[i] = Math.round(newRgb.r);
        data[i + 1] = Math.round(newRgb.g);
        data[i + 2] = Math.round(newRgb.b);
      }
    }
    
    return imageData;
  }

  private detectHairPixels(data: Uint8ClampedArray, width: number, height: number): boolean[] {
    const mask = new Array(width * height).fill(false);
    
    // 简化的头发检测：基于位置（上半部分）和颜色特征
    const hairRegionTop = Math.floor(height * 0.1);
    const hairRegionBottom = Math.floor(height * 0.6);
    
    for (let y = hairRegionTop; y < hairRegionBottom; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const pixelIndex = index * 4;
        
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // 检测深色像素（可能是头发）
        const brightness = (r + g + b) / 3;
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
        
        if (brightness < 120 && saturation > 10) {
          mask[index] = true;
        }
      }
    }
    
    return mask;
  }

  private async applyMakeup(imageData: ImageData, makeup: NonNullable<ProcessingOptions['makeup']>): Promise<ImageData> {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 检测面部特征区域
    const faceRegions = this.detectFaceRegions(data, width, height);
    
    if (makeup.lipstick) {
      this.applyLipstick(data, faceRegions.lips, makeup.lipstick);
    }
    
    if (makeup.eyeshadow) {
      this.applyEyeshadow(data, faceRegions.eyes, makeup.eyeshadow);
    }
    
    if (makeup.blush) {
      this.applyBlush(data, faceRegions.cheeks, makeup.blush);
    }
    
    return imageData;
  }

  private detectFaceRegions(data: Uint8ClampedArray, width: number, height: number) {
    // 简化的面部区域检测
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    return {
      lips: {
        x: centerX - 30,
        y: centerY + 40,
        width: 60,
        height: 20
      },
      eyes: [
        { x: centerX - 60, y: centerY - 20, width: 40, height: 15 },
        { x: centerX + 20, y: centerY - 20, width: 40, height: 15 }
      ],
      cheeks: [
        { x: centerX - 80, y: centerY + 10, width: 40, height: 30 },
        { x: centerX + 40, y: centerY + 10, width: 40, height: 30 }
      ]
    };
  }

  private applyLipstick(data: Uint8ClampedArray, lipRegion: any, color: string) {
    const rgb = this.hexToRgb(color);
    // 简化实现：在嘴唇区域混合颜色
    // 实际实现需要更精确的嘴唇检测
  }

  private applyEyeshadow(data: Uint8ClampedArray, eyeRegions: any[], color: string) {
    // 简化的眼影应用
  }

  private applyBlush(data: Uint8ClampedArray, cheekRegions: any[], color: string) {
    // 简化的腮红应用
  }

  private async addAccessories(imageData: ImageData, accessories: NonNullable<ProcessingOptions['accessories']>): Promise<ImageData> {
    // 配饰叠加功能
    return imageData;
  }

  // 颜色转换工具函数
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return { h, s, l };
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }
}

export const imageProcessor = new ImageProcessor();