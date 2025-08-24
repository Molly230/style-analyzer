"use client";

import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('网站正常运行！');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 text-pink-600">
          美颜风格分析系统
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          {message}
        </p>
        <button 
          onClick={() => setMessage('点击成功！AI分析功能正在开发中...')}
          className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
        >
          测试功能
        </button>
        <div className="mt-8 text-sm text-gray-500">
          <p>✅ Next.js 15 + TypeScript</p>
          <p>✅ Tailwind CSS</p>
          <p>✅ Vercel 部署</p>
        </div>
      </div>
    </div>
  );
}