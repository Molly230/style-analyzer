"use client";

import { useState } from 'react';
import { Upload, Palette, User, Sparkles } from 'lucide-react';
import FaceAnalyzer from '@/components/FaceAnalyzer';
import StyleResults from '@/components/StyleResults';

interface AnalysisResult {
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
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'results'>('upload');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="text-pink-500" size={32} />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            美颜风格分析
          </h1>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          AI智能分析你的肤色与脸型，为你推荐最适合的穿搭风格、发色和造型
        </p>
      </header>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8 px-4">
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto w-full max-w-lg">
          {[
            { id: 'upload', label: '上传照片', icon: Upload },
            { id: 'analyze', label: '智能分析', icon: User },
            { id: 'results', label: '风格推荐', icon: Palette },
          ].map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = ['upload', 'analyze'].indexOf(step.id) < ['upload', 'analyze'].indexOf(currentStep);
            
            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className={`
                  flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 
                  ${isActive ? 'bg-pink-500 border-pink-500 text-white' : 
                    isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                    'border-gray-300 text-gray-400'}
                `}>
                  <Icon size={16} className="sm:w-5 sm:h-5" />
                </div>
                <span className={`ml-2 text-xs sm:text-sm font-medium ${
                  isActive ? 'text-pink-600' : 
                  isCompleted ? 'text-green-600' : 'text-gray-400'
                } hidden sm:block`}>
                  {step.label}
                </span>
                {index < 2 && (
                  <div className={`w-8 sm:w-20 h-0.5 mx-2 sm:mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8">
        {currentStep === 'upload' && (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              开始你的风格分析之旅
            </h2>
            <FaceAnalyzer 
              onAnalysisComplete={(result, imageData) => {
                setAnalysisResult(result);
                setOriginalImage(imageData);
                setCurrentStep('results');
              }}
            />
          </div>
        )}

        {currentStep === 'analyze' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">AI正在分析中...</h3>
            <p className="text-gray-500">请稍候，我们正在为你量身定制风格建议</p>
          </div>
        )}

        {currentStep === 'results' && analysisResult && (
          <StyleResults 
            result={{
              ...(analysisResult as AnalysisResult),
              originalImage: originalImage || undefined
            }}
            onRestart={() => {
              setCurrentStep('upload');
              setAnalysisResult(null);
              setOriginalImage(null);
            }}
          />
        )}
      </div>

      {/* Features */}
      <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
        {[
          {
            icon: <User className="text-pink-500" size={24} />,
            title: "精准脸型分析",
            desc: "AI识别椭圆、圆形、方形等8种脸型"
          },
          {
            icon: <Palette className="text-purple-500" size={24} />,
            title: "专业肤色诊断", 
            desc: "四季色彩理论，匹配最佳色系"
          },
          {
            icon: <Sparkles className="text-pink-500" size={24} />,
            title: "个性化建议",
            desc: "衣领、发色、刘海一站式推荐"
          }
        ].map((feature, index) => (
          <div key={index} className="bg-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
            <p className="text-sm sm:text-base text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
