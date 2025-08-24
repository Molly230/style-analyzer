export class BackgroundRemovalEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async removeBackground(imageData: string): Promise<string> {
    const img = await this.loadImage(imageData);
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);

    const imagePixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const processedData = await this.processImageData(imagePixelData);
    
    this.ctx.putImageData(processedData, 0, 0);
    return this.canvas.toDataURL('image/png');
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

  private async processImageData(imageData: ImageData): Promise<ImageData> {
    const { data, width, height } = imageData;
    
    // 第一步：检测肤色区域
    const skinMask = this.detectSkinPixels(data, width, height);
    
    // 第二步：检测头发区域
    const hairMask = this.detectHairPixels(data, width, height);
    
    // 第三步：检测服装区域
    const clothingMask = this.detectClothingPixels(data, width, height, skinMask);
    
    // 第四步：合并人像区域
    const personMask = this.combinePersonMasks(skinMask, hairMask, clothingMask, width, height);
    
    // 第五步：形态学处理优化边缘
    const refinedMask = this.refineMask(personMask, width, height);
    
    // 第六步：应用蒙版
    return this.applyMask(imageData, refinedMask);
  }

  private detectSkinPixels(data: Uint8ClampedArray, width: number, height: number): boolean[] {
    const mask = new Array(width * height).fill(false);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 改进的肤色检测算法 - 基于多个色彩空间
      if (this.isSkinColor(r, g, b)) {
        const pixelIndex = Math.floor(i / 4);
        mask[pixelIndex] = true;
      }
    }
    
    return mask;
  }

  private isSkinColor(r: number, g: number, b: number): boolean {
    // YCbCr 色彩空间检测
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = -0.169 * r - 0.331 * g + 0.5 * b + 128;
    const cr = 0.5 * r - 0.419 * g - 0.081 * b + 128;
    
    // HSV 色彩空间检测
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : diff / max;
    const v = max / 255;
    
    // 组合判断条件
    const ycbcrSkin = (cr >= 133 && cr <= 173 && cb >= 77 && cb <= 127);
    const hsvSkin = (h >= 0 && h <= 50 && s >= 0.2 && s <= 0.7 && v >= 0.4);
    const rgbSkin = (r > 95 && g > 40 && b > 20 && 
                     Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                     Math.abs(r - g) > 15 && r > g && r > b);
    
    return ycbcrSkin || (hsvSkin && rgbSkin);
  }

  private detectHairPixels(data: Uint8ClampedArray, width: number, height: number): boolean[] {
    const mask = new Array(width * height).fill(false);
    
    // 检测上半部分的深色区域
    const hairRegionTop = Math.floor(height * 0.05);
    const hairRegionBottom = Math.floor(height * 0.55);
    
    for (let y = hairRegionTop; y < hairRegionBottom; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const pixelIndex = index * 4;
        
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        // 检测深色像素（头发通常较暗）
        const brightness = (r + g + b) / 3;
        const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b);
        
        // 头发特征：亮度较低，可能有一定饱和度
        if (brightness < 140 && (saturation > 0.1 || brightness < 80)) {
          mask[index] = true;
        }
      }
    }
    
    return mask;
  }

  private detectClothingPixels(
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    skinMask: boolean[]
  ): boolean[] {
    const mask = new Array(width * height).fill(false);
    
    // 检测下半部分，排除肤色区域
    const clothingRegionTop = Math.floor(height * 0.4);
    
    for (let y = clothingRegionTop; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        
        // 如果不是肤色，且在服装区域，则认为是服装
        if (!skinMask[index]) {
          const pixelIndex = index * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          
          // 排除明显的背景色（太亮或太单调的颜色）
          const brightness = (r + g + b) / 3;
          const variance = Math.pow(r - brightness, 2) + 
                          Math.pow(g - brightness, 2) + 
                          Math.pow(b - brightness, 2);
          
          // 如果有一定的颜色变化，认为是前景
          if (variance > 100 || brightness < 200) {
            mask[index] = true;
          }
        }
      }
    }
    
    return mask;
  }

  private combinePersonMasks(
    skinMask: boolean[], 
    hairMask: boolean[], 
    clothingMask: boolean[], 
    width: number, 
    height: number
  ): boolean[] {
    const combinedMask = new Array(width * height).fill(false);
    
    for (let i = 0; i < combinedMask.length; i++) {
      combinedMask[i] = skinMask[i] || hairMask[i] || clothingMask[i];
    }
    
    return combinedMask;
  }

  private refineMask(mask: boolean[], width: number, height: number): boolean[] {
    // 形态学开运算（腐蚀+膨胀）去除噪点
    let refinedMask = this.erode(mask, width, height, 2);
    refinedMask = this.dilate(refinedMask, width, height, 3);
    
    // 填充空洞
    refinedMask = this.fillHoles(refinedMask, width, height);
    
    // 边缘平滑
    refinedMask = this.smoothEdges(refinedMask, width, height);
    
    return refinedMask;
  }

  private erode(mask: boolean[], width: number, height: number, radius: number): boolean[] {
    const result = new Array(mask.length).fill(false);
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const index = y * width + x;
        
        let allTrue = true;
        for (let dy = -radius; dy <= radius && allTrue; dy++) {
          for (let dx = -radius; dx <= radius && allTrue; dx++) {
            const neighborIndex = (y + dy) * width + (x + dx);
            if (!mask[neighborIndex]) {
              allTrue = false;
            }
          }
        }
        
        result[index] = allTrue;
      }
    }
    
    return result;
  }

  private dilate(mask: boolean[], width: number, height: number, radius: number): boolean[] {
    const result = [...mask];
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const index = y * width + x;
        
        if (mask[index]) {
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const neighborIndex = (y + dy) * width + (x + dx);
              if (dx * dx + dy * dy <= radius * radius) {
                result[neighborIndex] = true;
              }
            }
          }
        }
      }
    }
    
    return result;
  }

  private fillHoles(mask: boolean[], width: number, height: number): boolean[] {
    const result = [...mask];
    
    // 简单的空洞填充：如果一个像素被前景像素包围，则填充
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        
        if (!mask[index]) {
          let surroundingTrue = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const neighborIndex = (y + dy) * width + (x + dx);
              if (mask[neighborIndex]) surroundingTrue++;
            }
          }
          
          // 如果大部分邻居都是前景，则填充
          if (surroundingTrue >= 6) {
            result[index] = true;
          }
        }
      }
    }
    
    return result;
  }

  private smoothEdges(mask: boolean[], width: number, height: number): boolean[] {
    const result = [...mask];
    
    // 边缘平滑：对边缘像素进行高斯模糊处理
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        
        // 检查是否为边缘像素
        let isEdge = false;
        for (let dy = -1; dy <= 1 && !isEdge; dy++) {
          for (let dx = -1; dx <= 1 && !isEdge; dx++) {
            const neighborIndex = (y + dy) * width + (x + dx);
            if (mask[index] !== mask[neighborIndex]) {
              isEdge = true;
            }
          }
        }
        
        if (isEdge) {
          // 对边缘像素进行加权平均
          let weightedSum = 0;
          let totalWeight = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const neighborIndex = (y + dy) * width + (x + dx);
              const weight = dx === 0 && dy === 0 ? 4 : (Math.abs(dx) + Math.abs(dy) === 1 ? 2 : 1);
              weightedSum += (mask[neighborIndex] ? 1 : 0) * weight;
              totalWeight += weight;
            }
          }
          
          result[index] = (weightedSum / totalWeight) > 0.5;
        }
      }
    }
    
    return result;
  }

  private applyMask(imageData: ImageData, mask: boolean[]): ImageData {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) {
        // 设置为透明
        result.data[i * 4 + 3] = 0;
      }
    }
    
    return result;
  }
}

export const backgroundRemoval = new BackgroundRemovalEngine();