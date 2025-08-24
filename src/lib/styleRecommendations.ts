import { FaceShapeType, SkinToneType, SkinUndertoneType } from './faceAnalysis';

export interface StyleRecommendations {
  colors: string[];
  patterns: string[];
  necklines: string[];
  hairColors: string[];
  bangs: string[];
  accessories: string[];
  makeupTips: string[];
}

export interface ColorPalette {
  primary: string[];
  accent: string[];
  neutral: string[];
  avoid: string[];
}

class StyleRecommendationEngine {
  
  generateRecommendations(
    faceShape: FaceShapeType,
    skinTone: SkinToneType,
    skinUndertone: SkinUndertoneType
  ): StyleRecommendations {
    const colorPalette = this.getColorPalette(skinTone, skinUndertone);
    const faceShapeRecs = this.getFaceShapeRecommendations(faceShape);
    
    return {
      colors: [...colorPalette.primary, ...colorPalette.accent],
      patterns: this.getPatternRecommendations(faceShape, skinTone),
      necklines: faceShapeRecs.necklines,
      hairColors: this.getHairColorRecommendations(skinTone, skinUndertone),
      bangs: faceShapeRecs.bangs,
      accessories: this.getAccessoryRecommendations(faceShape),
      makeupTips: this.getMakeupTips(faceShape, skinTone, skinUndertone)
    };
  }

  private getColorPalette(tone: SkinToneType, undertone: SkinUndertoneType): ColorPalette {
    const palettes = {
      // 冷色调肤色
      cool_pink: {
        primary: ['#E6E6FA', '#DDA0DD', '#9370DB', '#8A2BE2', '#4B0082'],
        accent: ['#FFB6C1', '#FF69B4', '#DC143C', '#B22222'],
        neutral: ['#F8F8FF', '#E0E0E0', '#C0C0C0', '#696969'],
        avoid: ['#FF8C00', '#FF6347', '#FF4500', '#OrangeRed']
      },
      cool_olive: {
        primary: ['#F0F8FF', '#E0FFFF', '#AFEEEE', '#40E0D0', '#008B8B'],
        accent: ['#00CED1', '#20B2AA', '#5F9EA0', '#4682B4'],
        neutral: ['#F5F5F5', '#DCDCDC', '#A9A9A9', '#2F4F4F'],
        avoid: ['#FF8C00', '#FF7F50', '#FF6347']
      },
      
      // 暖色调肤色
      warm_yellow: {
        primary: ['#FFF8DC', '#FFEBCD', '#DEB887', '#D2691E', '#8B4513'],
        accent: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347'],
        neutral: ['#FFFAF0', '#F5DEB3', '#DDD', '#8B7D6B'],
        avoid: ['#FF1493', '#DC143C', '#8A2BE2']
      },
      warm_pink: {
        primary: ['#FFF0F5', '#FFE4E1', '#FFC0CB', '#FF91A4', '#C71585'],
        accent: ['#FF69B4', '#FF1493', '#DC143C', '#B22222'],
        neutral: ['#FFFAFA', '#F0E68C', '#DDD', '#696969'],
        avoid: ['#00FFFF', '#40E0D0', '#0000FF']
      },
      
      // 中性肤色
      neutral_yellow: {
        primary: ['#FFFACD', '#F0E68C', '#BDB76B', '#808000', '#6B8E23'],
        accent: ['#FF6347', '#FF4500', '#32CD32', '#228B22'],
        neutral: ['#F5F5F5', '#E6E6FA', '#D3D3D3', '#808080'],
        avoid: []
      },
      neutral_pink: {
        primary: ['#FFF0F5', '#FAEBD7', '#DDA0DD', '#DA70D6', '#BA55D3'],
        accent: ['#FF69B4', '#FF1493', '#32CD32', '#008000'],
        neutral: ['#F8F8FF', '#E6E6FA', '#D3D3D3', '#708090'],
        avoid: []
      }
    };

    const key = `${tone}_${undertone}` as keyof typeof palettes;
    return palettes[key] || palettes.neutral_yellow;
  }

  private getFaceShapeRecommendations(faceShape: FaceShapeType): {
    necklines: string[];
    bangs: string[];
  } {
    const recommendations = {
      oval: {
        necklines: ['v-neck', 'scoop neck', 'boat neck', 'high neck', 'off-shoulder'],
        bangs: ['side-swept', 'curtain bangs', 'straight', 'wispy']
      },
      round: {
        necklines: ['v-neck', 'deep v-neck', 'scoop neck', 'boat neck'],
        bangs: ['side-swept', 'long side bangs', 'no bangs']
      },
      square: {
        necklines: ['scoop neck', 'boat neck', 'cowl neck', 'off-shoulder'],
        bangs: ['side-swept', 'curtain bangs', 'wispy']
      },
      heart: {
        necklines: ['boat neck', 'off-shoulder', 'square neck', 'strapless'],
        bangs: ['curtain bangs', 'side-swept', 'full bangs']
      },
      long: {
        necklines: ['boat neck', 'cowl neck', 'turtle neck', 'high neck'],
        bangs: ['straight', 'full bangs', 'curtain bangs']
      },
      diamond: {
        necklines: ['v-neck', 'scoop neck', 'boat neck'],
        bangs: ['side-swept', 'curtain bangs', 'no bangs']
      },
      triangle: {
        necklines: ['v-neck', 'deep v-neck', 'scoop neck'],
        bangs: ['side-swept', 'curtain bangs', 'wispy']
      }
    };

    return recommendations[faceShape];
  }

  private getPatternRecommendations(faceShape: FaceShapeType, skinTone: SkinToneType): string[] {
    const basePatterns = ['solid colors', 'subtle textures'];
    
    // 根据脸型调整图案建议
    const faceShapePatterns = {
      oval: ['small florals', 'geometric', 'stripes', 'polka dots'],
      round: ['vertical stripes', 'elongated patterns', 'small prints'],
      square: ['curved patterns', 'florals', 'soft geometrics'],
      heart: ['horizontal stripes', 'wide patterns', 'large prints'],
      long: ['horizontal patterns', 'wide stripes', 'bold prints'],
      diamond: ['small to medium patterns', 'soft geometrics'],
      triangle: ['small patterns', 'delicate prints']
    };

    // 根据肤色调整
    const tonePatterns = {
      cool: ['cool-toned prints', 'silver accents'],
      warm: ['warm-toned prints', 'gold accents'],
      neutral: ['mixed-tone prints', 'versatile patterns']
    };

    return [
      ...basePatterns,
      ...faceShapePatterns[faceShape],
      ...tonePatterns[skinTone]
    ];
  }

  private getHairColorRecommendations(tone: SkinToneType, undertone: SkinUndertoneType): string[] {
    const hairColors = {
      cool_pink: ['#2F1B14', '#8B4513', '#A0522D', '#DEB887'], // 深棕到浅棕
      cool_olive: ['#000000', '#2F2F2F', '#654321', '#8B4513'],
      warm_yellow: ['#D2691E', '#CD853F', '#F4A460', '#DDD'], // 栗色到金色
      warm_pink: ['#8B0000', '#A52A2A', '#B22222', '#CD5C5C'],
      neutral_yellow: ['#8B4513', '#A0522D', '#CD853F', '#DEB887'],
      neutral_pink: ['#2F1B14', '#8B4513', '#A0522D', '#DEB887']
    };

    const key = `${tone}_${undertone}` as keyof typeof hairColors;
    return hairColors[key] || hairColors.neutral_yellow;
  }

  private getAccessoryRecommendations(faceShape: FaceShapeType): string[] {
    const accessories = {
      oval: ['statement earrings', 'all necklace lengths', 'various hat styles'],
      round: ['long earrings', 'long necklaces', 'wide-brimmed hats'],
      square: ['round earrings', 'soft curved necklaces', 'round sunglasses'],
      heart: ['wide earrings', 'short necklaces', 'cat-eye sunglasses'],
      long: ['wide earrings', 'chokers', 'wide headbands'],
      diamond: ['statement earrings', 'medium necklaces', 'angular frames'],
      triangle: ['top-heavy earrings', 'statement necklaces', 'aviator sunglasses']
    };

    return accessories[faceShape];
  }

  private getMakeupTips(faceShape: FaceShapeType, skinTone: SkinToneType, undertone: SkinUndertoneType): string[] {
    const basePrep = ['使用适合肤色的粉底', '选择合适的遮瑕色号'];
    
    const faceShapeTips = {
      oval: ['可以尝试各种妆容风格', '眉形可以稍微加粗'],
      round: ['用修容粉瘦脸', '眉形画成上挑的弧形'],
      square: ['柔化下颌线条', '眉形画成柔和的弧形'],
      heart: ['重点突出下半部分', '用腮红平衡上下比例'],
      long: ['横向拉宽视觉效果', '在两颊打高光'],
      diamond: ['突出眼部妆容', '柔化颧骨线条'],
      triangle: ['突出眼部和上半部分', '下颌线条要柔化']
    };

    const skinToneTips = {
      cool: ['选择冷色调的口红和腮红', '眼影可选紫色、蓝色系'],
      warm: ['选择暖色调的口红和腮红', '眼影可选橙色、金色系'],
      neutral: ['冷暖色调都适合', '可以根据服装选择妆容色调']
    };

    return [
      ...basePrep,
      ...faceShapeTips[faceShape],
      ...skinToneTips[skinTone]
    ];
  }
}

export const styleRecommendationEngine = new StyleRecommendationEngine();