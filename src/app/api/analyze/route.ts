import { NextRequest, NextResponse } from 'next/server';
import { faceAnalysisEngine } from '@/lib/faceAnalysis';
import { styleRecommendationEngine } from '@/lib/styleRecommendations';

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();
    
    if (!imageData) {
      return NextResponse.json(
        { error: '缺少图片数据' },
        { status: 400 }
      );
    }

    // 进行AI面部分析
    const analysisResult = await faceAnalysisEngine.analyzeImage(imageData);
    
    // 生成风格推荐
    const recommendations = styleRecommendationEngine.generateRecommendations(
      analysisResult.faceShape,
      analysisResult.skinTone,
      analysisResult.skinUndertone
    );

    const result = {
      faceShape: analysisResult.faceShape,
      skinTone: analysisResult.skinTone,
      skinUndertone: analysisResult.skinUndertone,
      confidence: analysisResult.confidence,
      recommendations: {
        colors: recommendations.colors,
        patterns: recommendations.patterns,
        necklines: recommendations.necklines,
        hairColors: recommendations.hairColors,
        bangs: recommendations.bangs,
        accessories: recommendations.accessories,
        makeupTips: recommendations.makeupTips
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('分析API错误:', error);
    return NextResponse.json(
      { error: '分析失败，请重试' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '美颜风格分析API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/analyze - 分析用户照片并生成风格建议'
    }
  });
}