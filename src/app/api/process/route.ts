import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageData, options } = await request.json();
    
    if (!imageData) {
      return NextResponse.json(
        { error: '缺少图片数据' },
        { status: 400 }
      );
    }

    // 动态导入以避免服务端渲染问题
    const { imageProcessor } = await import('@/lib/imageProcessing');
    
    // 处理图片
    const processedImage = await imageProcessor.processImage(imageData, options || {});

    return NextResponse.json({
      processedImage,
      options: options || {},
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('图片处理API错误:', error);
    return NextResponse.json(
      { error: '图片处理失败，请重试' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '图片处理API',
    version: '1.0.0',
    supportedOptions: {
      removeBackground: 'boolean - 移除背景',
      hairColor: 'string - 改变发色 (hex颜色值)',
      makeup: {
        lipstick: 'string - 口红颜色 (hex)',
        eyeshadow: 'string - 眼影颜色 (hex)',
        blush: 'string - 腮红颜色 (hex)'
      },
      accessories: {
        earrings: 'string - 耳环样式',
        necklace: 'string - 项链样式'
      }
    }
  });
}