"use client";

import { useState, useEffect, useRef } from 'react';
import { Palette, Scissors, Sparkles, Download, RotateCcw } from 'lucide-react';
import { imageProcessor } from '@/lib/imageProcessing';

interface VirtualTryOnProps {
  originalImage: string;
  recommendations: {
    colors: string[];
    hairColors: string[];
    bangs: string[];
  };
}

export default function VirtualTryOn({ originalImage, recommendations }: VirtualTryOnProps) {
  const [processedImage, setProcessedImage] = useState(originalImage);
  const [activeTab, setActiveTab] = useState<'hair' | 'makeup' | 'accessories'>('hair');
  const [selectedHairColor, setSelectedHairColor] = useState<string>('');
  const [selectedMakeup, setSelectedMakeup] = useState({
    lipstick: '',
    eyeshadow: '',
    blush: ''
  });
  const [processing, setProcessing] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      img.src = processedImage;
    }
  }, [processedImage]);

  const applyChanges = async () => {
    setProcessing(true);
    
    try {
      const processed = await imageProcessor.processImage(originalImage, {
        hairColor: selectedHairColor || undefined,
        makeup: {
          lipstick: selectedMakeup.lipstick || undefined,
          eyeshadow: selectedMakeup.eyeshadow || undefined,
          blush: selectedMakeup.blush || undefined
        }
      });
      
      setProcessedImage(processed);
    } catch (error) {
      console.error('处理失败:', error);
      alert('图像处理失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const resetImage = () => {
    setProcessedImage(originalImage);
    setSelectedHairColor('');
    setSelectedMakeup({ lipstick: '', eyeshadow: '', blush: '' });
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = '虚拟试妆结果.jpg';
    link.href = processedImage;
    link.click();
  };

  const makeupColors = {
    lipstick: [
      { name: '珊瑚粉', color: '#FF7F7F' },
      { name: '玫瑰红', color: '#FF1493' },
      { name: '浆果色', color: '#8B008B' },
      { name: '裸粉色', color: '#DDA0DD' }
    ],
    eyeshadow: [
      { name: '大地色', color: '#DEB887' },
      { name: '烟熏灰', color: '#708090' },
      { name: '紫罗兰', color: '#9370DB' },
      { name: '香槟金', color: '#F7E7CE' }
    ],
    blush: [
      { name: '桃花粉', color: '#FFDAB9' },
      { name: '珊瑚橙', color: '#FF7F50' },
      { name: '玫瑰粉', color: '#FFB6C1' },
      { name: '杏仁色', color: '#FFDBAC' }
    ]
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="text-pink-500" size={24} />
        <h3 className="text-xl font-semibold text-gray-800">
          虚拟试妆试色
        </h3>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 图片预览区域 */}
        <div className="space-y-4">
          <div className="relative bg-gray-50 rounded-lg overflow-hidden">
            <img
              src={processedImage}
              alt="虚拟试妆效果"
              className="w-full h-auto max-h-96 object-contain mx-auto"
            />
            {processing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">AI处理中...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={applyChanges}
              disabled={processing}
              className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              应用效果
            </button>
            <button
              onClick={resetImage}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <RotateCcw size={16} />
              重置
            </button>
            <button
              onClick={downloadImage}
              className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              下载
            </button>
          </div>
        </div>

        {/* 控制面板 */}
        <div>
          {/* 标签导航 */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'hair', label: '发色', icon: Scissors },
              { id: 'makeup', label: '妆容', icon: Palette },
              { id: 'accessories', label: '配饰', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'hair' | 'lipstick' | 'eyeshadow' | 'accessories')}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-medium transition-all
                    ${activeTab === tab.id
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 发色选择 */}
          {activeTab === 'hair' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800 mb-3">选择发色</h4>
              <div className="grid grid-cols-4 gap-3">
                {recommendations.hairColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedHairColor(color)}
                    className={`
                      w-12 h-12 rounded-full border-4 transition-all
                      ${selectedHairColor === color 
                        ? 'border-pink-500 transform scale-110' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-sm">
                  💡 选择适合你肤色的发色，点击&quot;应用效果&quot;查看虚拟效果
                </p>
              </div>
            </div>
          )}

          {/* 妆容选择 */}
          {activeTab === 'makeup' && (
            <div className="space-y-6">
              {/* 口红 */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">口红色号</h4>
                <div className="grid grid-cols-4 gap-2">
                  {makeupColors.lipstick.map((lipstick, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMakeup(prev => ({ ...prev, lipstick: lipstick.color }))}
                      className={`
                        p-2 rounded-lg border text-center transition-all
                        ${selectedMakeup.lipstick === lipstick.color
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div
                        className="w-6 h-6 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: lipstick.color }}
                      />
                      <p className="text-xs text-gray-600">{lipstick.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 眼影 */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">眼影色调</h4>
                <div className="grid grid-cols-4 gap-2">
                  {makeupColors.eyeshadow.map((eyeshadow, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMakeup(prev => ({ ...prev, eyeshadow: eyeshadow.color }))}
                      className={`
                        p-2 rounded-lg border text-center transition-all
                        ${selectedMakeup.eyeshadow === eyeshadow.color
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div
                        className="w-6 h-6 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: eyeshadow.color }}
                      />
                      <p className="text-xs text-gray-600">{eyeshadow.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 腮红 */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">腮红颜色</h4>
                <div className="grid grid-cols-4 gap-2">
                  {makeupColors.blush.map((blush, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMakeup(prev => ({ ...prev, blush: blush.color }))}
                      className={`
                        p-2 rounded-lg border text-center transition-all
                        ${selectedMakeup.blush === blush.color
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div
                        className="w-6 h-6 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: blush.color }}
                      />
                      <p className="text-xs text-gray-600">{blush.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 配饰 */}
          {activeTab === 'accessories' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800 mb-3">虚拟配饰</h4>
              <div className="text-center py-8 text-gray-500">
                <Sparkles size={48} className="mx-auto mb-4 text-gray-300" />
                <p>配饰试戴功能开发中...</p>
                <p className="text-sm">即将支持耳环、项链等配饰试戴</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}