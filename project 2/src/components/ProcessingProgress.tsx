import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingProgressProps {
  progress: number;
}

export function ProcessingProgress({ progress }: ProcessingProgressProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-center mb-4">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">CSVファイルを処理中</h3>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="text-center">
        <p className="text-gray-600 mb-2">{progress}% 完了</p>
        <div className="text-sm text-gray-500">
          {progress < 30 && "ファイル構造を検証中..."}
          {progress >= 30 && progress < 60 && "CSVデータを結合中..."}
          {progress >= 60 && progress < 90 && "ヤマト運輸形式に変換中..."}
          {progress >= 90 && "出力ファイルを生成中..."}
        </div>
      </div>
    </div>
  );
}