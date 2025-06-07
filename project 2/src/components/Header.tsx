import React from 'react';
import { Truck, FileSpreadsheet } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ヤマト運輸 送り状CSV変換ツール
              </h1>
              <p className="text-gray-600">
                複数のCSVファイルをヤマト運輸の送り状形式に一括変換
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              本格運用対応
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}