"use client";

import { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X } from 'lucide-react';

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

interface FaceAnalyzerProps {
  onAnalysisComplete: (result: AnalysisResult, imageData: string) => void;
}

export default function FaceAnalyzer({ onAnalysisComplete }: FaceAnalyzerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('无法访问摄像头:', error);
      alert('无法访问摄像头，请检查权限设置');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        setImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImage(result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('请选择有效的图片文件');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    
    try {
      // 动态导入AI分析引擎
      const { faceAnalysisEngine } = await import('@/lib/faceAnalysis');
      const { styleRecommendationEngine } = await import('@/lib/styleRecommendations');
      
      // 进行AI面部分析
      const analysisResult = await faceAnalysisEngine.analyzeImage(image);
      
      // 生成风格推荐
      const recommendations = styleRecommendationEngine.generateRecommendations(
        analysisResult.faceShape,
        analysisResult.skinTone,
        analysisResult.skinUndertone
      );
      
      // 首先进行抠图处理
      const { backgroundRemoval } = await import('@/lib/backgroundRemoval');
      const croppedImage = await backgroundRemoval.removeBackground(image);
      
      const result = {
        faceShape: analysisResult.faceShape,
        skinTone: analysisResult.skinTone,
        skinUndertone: analysisResult.skinUndertone,
        confidence: analysisResult.confidence,
        croppedImage: croppedImage, // 添加抠图结果
        recommendations: {
          colors: recommendations.colors,
          patterns: recommendations.patterns,
          necklines: recommendations.necklines,
          hairColors: recommendations.hairColors,
          bangs: recommendations.bangs,
          accessories: recommendations.accessories,
          makeupTips: recommendations.makeupTips
        }
      };
      
      onAnalysisComplete(result, image);
    } catch (error) {
      console.error('分析失败:', error);
      alert('分析失败，请重试或检查图片质量');
    } finally {
      setAnalyzing(false);
    }
  };

  if (showCamera) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-sm sm:max-w-md mx-auto rounded-lg shadow-lg"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex gap-3 sm:gap-4 justify-center">
          <button
            onClick={capturePhoto}
            className="bg-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-pink-600 transition-colors text-sm sm:text-base"
          >
            📸 拍照
          </button>
          <button
            onClick={stopCamera}
            className="bg-gray-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  if (image) {
    return (
      <div className="space-y-6">
        <div className="relative">
          <img
            src={image}
            alt="上传的照片"
            className="w-full max-w-sm sm:max-w-md mx-auto rounded-lg shadow-lg"
          />
          <button
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="text-center">
          {analyzing ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
              <p className="text-gray-600 text-sm sm:text-base">AI正在分析你的面部特征...</p>
            </div>
          ) : (
            <button
              onClick={analyzeImage}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              ✨ 开始智能分析
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 上传区域 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          上传你的照片
        </h3>
        <p className="text-gray-500 mb-4">
          拖拽图片到这里，或点击选择文件
        </p>
        <p className="text-sm text-gray-400">
          支持 JPG、PNG 格式，文件大小不超过 10MB
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
      </div>

      {/* 或者分隔线 */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-gray-500 font-medium">或者</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      {/* 拍照按钮 */}
      <div className="text-center">
        <button
          onClick={startCamera}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 flex items-center gap-2 sm:gap-3 mx-auto"
        >
          <Camera size={20} className="sm:w-6 sm:h-6" />
          📱 使用相机拍照
        </button>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          确保光线充足，面部清晰可见
        </p>
      </div>

      {/* 使用提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">📝 拍照建议</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• 选择光线明亮、均匀的环境</li>
          <li>• 确保面部完整出现在画面中</li>
          <li>• 避免戴帽子、墨镜等遮挡面部</li>
          <li>• 保持中性表情，正面拍摄效果最佳</li>
        </ul>
      </div>
    </div>
  );
}