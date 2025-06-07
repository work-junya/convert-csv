import React, { useState } from 'react';
import { FileUploadZone } from './components/FileUploadZone';
import { ProcessingProgress } from './components/ProcessingProgress';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Header } from './components/Header';
import { Instructions } from './components/Instructions';
import { FileX, AlertCircle } from 'lucide-react';

interface UploadedFile {
  file: File;
  preview?: any[];
  headers?: string[];
}

interface ProcessingResult {
  success: boolean;
  recordCount?: number;
  data?: any[];
  error?: string;
  errors?: string[];
}

function App() {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const fileTypes = [
    {
      key: 'orders',
      title: '注文データCSV',
      description: '注文詳細と顧客参照情報',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      key: 'customers',
      title: '顧客マスタCSV',
      description: '顧客情報と住所データ',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      key: 'shipping',
      title: '配送設定CSV',
      description: '配送希望日時と配送指示',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      key: 'products',
      title: '商品マスタCSV',
      description: '商品仕様と詳細情報',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    }
  ];

  const handleFileUpload = async (fileType: string, file: File) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: { file }
    }));

    // プレビューデータを取得
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:3001/api/preview', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const previewData = await response.json();
        setUploadedFiles(prev => ({
          ...prev,
          [fileType]: {
            ...prev[fileType],
            preview: previewData.data,
            headers: previewData.headers
          }
        }));
      }
    } catch (error) {
      console.error('プレビューエラー:', error);
    }
  };

  const handleFileRemove = (fileType: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fileType];
      return newFiles;
    });
  };

  const processFiles = async () => {
    if (Object.keys(uploadedFiles).length < 4) {
      setErrors(['必要な4つのCSVファイルをすべてアップロードしてください']);
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setErrors([]);
    setResult(null);

    try {
      const formData = new FormData();
      
      Object.entries(uploadedFiles).forEach(([fileType, { file }]) => {
        formData.append(fileType, file);
      });

      // 進捗更新をシミュレート
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      const result = await response.json();
      
      if (result.success) {
        setResult(result);
      } else {
        setErrors([result.error, ...(result.errors || [])]);
      }
    } catch (error) {
      setErrors([`処理に失敗しました: ${error.message}`]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingProgress(0), 2000);
    }
  };

  const resetAll = () => {
    setUploadedFiles({});
    setResult(null);
    setErrors([]);
    setProcessingProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Instructions />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {fileTypes.map((fileType) => (
            <FileUploadZone
              key={fileType.key}
              fileType={fileType.key}
              title={fileType.title}
              description={fileType.description}
              colorClass={fileType.color}
              uploadedFile={uploadedFiles[fileType.key]}
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
            />
          ))}
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-red-800">処理エラー</h3>
            </div>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={processFiles}
            disabled={Object.keys(uploadedFiles).length < 4 || isProcessing}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl"
          >
            {isProcessing ? '処理中...' : 'ヤマト運輸形式に変換'}
          </button>
          
          <button
            onClick={resetAll}
            className="flex items-center justify-center px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileX className="h-5 w-5 mr-2" />
            すべてリセット
          </button>
        </div>

        {isProcessing && (
          <ProcessingProgress progress={processingProgress} />
        )}

        {result && result.success && (
          <ResultsDisplay result={result} />
        )}
      </main>
    </div>
  );
}

export default App;