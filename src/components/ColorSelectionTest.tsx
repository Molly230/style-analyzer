"use client";

import { useState, useRef, useEffect } from 'react';
import { Check, RotateCcw, Download } from 'lucide-react';

interface ColorChoice {
  color: string;
  name: string;
  category: 'warm' | 'cool' | 'neutral';
  count: number;
}

interface ColorSelectionTestProps {
  croppedImage: string;
  onComplete: (selectedColors: ColorChoice[], recommendation: {
    season: string;
    confidence: number;
    bestColors: string[];
  }) => void;
}

const COLOR_PALETTE = [
  // 暖色系
  { color: '#FFB6C1', name: '粉玫瑰', category: 'warm' as const },
  { color: '#FFA07A', name: '浅珊瑚', category: 'warm' as const },
  { color: '#F0E68C', name: '卡其黄', category: 'warm' as const },
  { color: '#DEB887', name: '淡棕色', category: 'warm' as const },
  { color: '#D2691E', name: '巧克力', category: 'warm' as const },
  { color: '#CD853F', name: '秘鲁色', category: 'warm' as const },
  { color: '#FFD700', name: '金黄色', category: 'warm' as const },
  { color: '#FFA500', name: '橙色', category: 'warm' as const },
  
  // 冷色系  
  { color: '#E6E6FA', name: '薰衣草', category: 'cool' as const },
  { color: '#DDA0DD', name: '梅花色', category: 'cool' as const },
  { color: '#9370DB', name: '中紫色', category: 'cool' as const },
  { color: '#4682B4', name: '钢蓝色', category: 'cool' as const },
  { color: '#40E0D0', name: '绿松石', category: 'cool' as const },
  { color: '#00CED1', name: '深绿松', category: 'cool' as const },
  { color: '#20B2AA', name: '浅海绿', category: 'cool' as const },
  { color: '#5F9EA0', name: '军蓝色', category: 'cool' as const },
  
  // 中性色系
  { color: '#F5F5DC', name: '米白色', category: 'neutral' as const },
  { color: '#DCDCDC', name: '浅灰色', category: 'neutral' as const },
  { color: '#C0C0C0', name: '银灰色', category: 'neutral' as const },
  { color: '#808080', name: '中灰色', category: 'neutral' as const },
  { color: '#696969', name: '暗灰色', category: 'neutral' as const },
  { color: '#2F4F4F', name: '深灰绿', category: 'neutral' as const },
  { color: '#8B7D6B', name: '灰褐色', category: 'neutral' as const },
  { color: '#A0522D', name: '马鞍棕', category: 'neutral' as const },
];

export default function ColorSelectionTest({ croppedImage, onComplete }: ColorSelectionTestProps) {
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
  const [selectedColors, setSelectedColors] = useState<ColorChoice[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const currentColor = COLOR_PALETTE[currentBackgroundIndex];

  const drawImageWithBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !croppedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // 设置canvas尺寸
      canvas.width = 400;
      canvas.height = 300;
      
      // 绘制背景色
      ctx.fillStyle = currentColor.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 计算图片居中位置
      const aspectRatio = img.width / img.height;
      let drawWidth = canvas.width * 0.6;
      let drawHeight = drawWidth / aspectRatio;
      
      if (drawHeight > canvas.height * 0.8) {
        drawHeight = canvas.height * 0.8;
        drawWidth = drawHeight * aspectRatio;
      }
      
      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;
      
      // 绘制图片
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    };
    img.src = croppedImage;
  }, [currentBackgroundIndex, croppedImage, currentColor]);

  useEffect(() => {
    drawImageWithBackground();
  }, [drawImageWithBackground]);

  const handleColorLike = () => {
    const existingColorIndex = selectedColors.findIndex(c => c.color === currentColor.color);
    
    if (existingColorIndex >= 0) {
      // 如果已选择过这个颜色，增加计数
      const updatedColors = [...selectedColors];
      updatedColors[existingColorIndex].count += 1;
      setSelectedColors(updatedColors);
    } else {
      // 添加新颜色选择
      setSelectedColors(prev => [...prev, {
        ...currentColor,
        count: 1
      }]);
    }

    // 自动切换到下一个颜色
    if (currentBackgroundIndex < COLOR_PALETTE.length - 1) {
      setCurrentBackgroundIndex(prev => prev + 1);
    } else {
      // 完成所有颜色测试
      completeTest();
    }
  };

  const handleColorSkip = () => {
    if (currentBackgroundIndex < COLOR_PALETTE.length - 1) {
      setCurrentBackgroundIndex(prev => prev + 1);
    } else {
      completeTest();
    }
  };

  const completeTest = () => {
    setIsComplete(true);
    
    // 分析用户选择，生成推荐
    const colorAnalysis = analyzeColorChoices(selectedColors);
    onComplete(selectedColors, colorAnalysis);
  };

  const analyzeColorChoices = (choices: ColorChoice[]) => {
    // 按类别统计选择频率
    const categoryStats = {
      warm: choices.filter(c => c.category === 'warm').reduce((sum, c) => sum + c.count, 0),
      cool: choices.filter(c => c.category === 'cool').reduce((sum, c) => sum + c.count, 0),
      neutral: choices.filter(c => c.category === 'neutral').reduce((sum, c) => sum + c.count, 0),
    };

    // 确定主要色调偏好
    const totalChoices = Object.values(categoryStats).reduce((sum, count) => sum + count, 0);
    const dominantCategory = Object.entries(categoryStats).reduce((a, b) => 
      categoryStats[a[0] as keyof typeof categoryStats] > categoryStats[b[0] as keyof typeof categoryStats] ? a : b
    )[0] as 'warm' | 'cool' | 'neutral';

    // 获取最喜欢的具体颜色（按选择次数排序）
    const topColors = choices
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 生成推荐色彩
    const recommendedColors = COLOR_PALETTE
      .filter(color => color.category === dominantCategory)
      .slice(0, 8);

    return {
      dominantCategory,
      categoryPercentages: {
        warm: Math.round((categoryStats.warm / totalChoices) * 100),
        cool: Math.round((categoryStats.cool / totalChoices) * 100),
        neutral: Math.round((categoryStats.neutral / totalChoices) * 100),
      },
      topColors,
      recommendedColors,
      totalChoices,
      analysis: {
        skinTone: dominantCategory,
        confidence: Math.max(...Object.values(categoryStats)) / totalChoices,
        preferences: topColors.map(c => c.name),
      }
    };
  };

  const resetTest = () => {
    setCurrentBackgroundIndex(0);
    setSelectedColors([]);
    setIsComplete(false);
  };

  const downloadResult = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `color-test-${currentColor.name}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  if (isComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            🎨 色彩测试完成！
          </h3>
          <p className="text-gray-600">
            你总共选择了 {selectedColors.reduce((sum, c) => sum + c.count, 0)} 种色彩
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">你最喜欢的颜色：</h4>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {selectedColors
              .sort((a, b) => b.count - a.count)
              .map((color, index) => (
              <div key={color.color} className="text-center">
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-gray-300 relative"
                  style={{ backgroundColor: color.color }}
                >
                  <div className="absolute -top-2 -right-2 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {color.count}
                  </div>
                </div>
                <p className="text-xs text-gray-600">{color.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={resetTest}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={16} />
            重新测试
          </button>
          <button
            onClick={downloadResult}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            下载结果
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 进度指示 */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          色彩偏好测试
        </h3>
        <p className="text-gray-600 mb-4">
          请选择你觉得适合这个造型的背景色
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentBackgroundIndex + 1) / COLOR_PALETTE.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          {currentBackgroundIndex + 1} / {COLOR_PALETTE.length}
        </p>
      </div>

      {/* 人像展示区域 */}
      <div className="flex justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-lg max-w-sm w-full h-auto"
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={handleColorSkip}
          className="bg-gray-400 text-white px-8 py-3 rounded-lg hover:bg-gray-500 transition-colors text-lg font-medium"
        >
          不喜欢
        </button>
        <button
          onClick={handleColorLike}
          className="bg-pink-500 text-white px-8 py-3 rounded-lg hover:bg-pink-600 transition-colors text-lg font-medium flex items-center gap-2"
        >
          <Check size={20} />
          喜欢这个
        </button>
      </div>

      {/* 已选择颜色预览 */}
      {selectedColors.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">已选择的颜色：</p>
          <div className="flex flex-wrap gap-2">
            {selectedColors.map((color, index) => (
              <div key={color.color} className="flex items-center gap-1">
                <div 
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.color }}
                />
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                  {color.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}