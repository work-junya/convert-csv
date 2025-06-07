import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Download, Info } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export function Instructions() {
  const [isExpanded, setIsExpanded] = useState(false);

  const downloadTemplate = async (type: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/templates/${type}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 日本語ファイル名のマッピング
      const fileNames = {
        orders: '注文データ.csv',
        customers: '顧客マスタ.csv',
        shipping: '配送設定.csv',
        products: '商品マスタ.csv'
      };
      
      a.download = fileNames[type] || `${type}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('ダウンロードに失敗しました:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <Info className="h-5 w-5 text-blue-600 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            使用方法とサンプルテンプレート
          </h2>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">使用手順</h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                <li>ドラッグ&ドロップエリアに必要な4つのCSVファイルをアップロード</li>
                <li>ファイルプレビューでデータ構造が正しいことを確認</li>
                <li>「ヤマト運輸形式に変換」ボタンをクリックして処理を実行</li>
                <li>変換されたヤマト運輸送り状CSVをダウンロード</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">サンプルテンプレートダウンロード</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'orders', label: '注文データ' },
                  { key: 'customers', label: '顧客マスタ' },
                  { key: 'shipping', label: '配送設定' },
                  { key: 'products', label: '商品マスタ' }
                ].map((template) => (
                  <button
                    key={template.key}
                    onClick={() => downloadTemplate(template.key)}
                    className="flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">重要な注意事項</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• 最大ファイルサイズ: 1ファイルあたり10MB</li>
              <li>• 最大レコード数: 1ファイルあたり1000件</li>
              <li>• 全てのCSVファイルに必須列が含まれている必要があります</li>
              <li>• 処理タイムアウト: 最大30秒</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
