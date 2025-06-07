import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Eye, AlertTriangle } from 'lucide-react';

interface FileUploadZoneProps {
  fileType: string;
  title: string;
  description: string;
  colorClass: string;
  uploadedFile?: {
    file: File;
    preview?: any[];
    headers?: string[];
  };
  onFileUpload: (fileType: string, file: File) => void;
  onFileRemove: (fileType: string) => void;
}

export function FileUploadZone({
  fileType,
  title,
  description,
  colorClass,
  uploadedFile,
  onFileUpload,
  onFileRemove
}: FileUploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        alert('無効なファイル形式またはサイズです。10MB以下のCSVファイルをアップロードしてください。');
        return;
      }
      if (acceptedFiles.length > 0) {
        onFileUpload(fileType, acceptedFiles[0]);
      }
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 バイト';
    const k = 1024;
    const sizes = ['バイト', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer
          ${uploadedFile ? 'border-green-300 bg-green-50' : colorClass}
          ${isDragActive ? 'border-blue-400 bg-blue-100 scale-105' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadedFile ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FileText className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">{title}</h3>
            <p className="text-green-700 mb-2">{uploadedFile.file.name}</p>
            <p className="text-sm text-green-600 mb-4">
              {formatFileSize(uploadedFile.file.size)} • 
              {uploadedFile.preview ? ` ${uploadedFile.preview.length} 件のレコード` : ' 処理中...'}
            </p>
            
            <div className="flex justify-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (uploadedFile.preview) {
                    alert(`プレビュー:\nヘッダー: ${uploadedFile.headers?.join(', ')}\n最初のレコード: ${JSON.stringify(uploadedFile.preview[0], null, 2)}`);
                  }
                }}
                className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Eye className="h-4 w-4 mr-1" />
                プレビュー
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemove(fileType);
                }}
                className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                削除
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              {isDragActive ? (
                <Upload className="h-12 w-12 text-blue-500 animate-bounce" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-4">{description}</p>
            <div className="text-sm text-gray-500">
              {isDragActive ? (
                <p className="text-blue-600 font-medium">ここにファイルをドロップ</p>
              ) : (
                <p>CSVファイルをドラッグ&ドロップするか、<span className="text-blue-600 font-medium">クリックして選択</span></p>
              )}
              <p className="mt-1">最大サイズ: 10MB</p>
            </div>
          </div>
        )}
      </div>

      {!uploadedFile && (
        <div className="absolute top-2 right-2">
          <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
            必須
          </div>
        </div>
      )}
    </div>
  );
}