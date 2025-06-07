import React from 'react';
import { CheckCircle, Download, FileText, BarChart3 } from 'lucide-react';

interface ResultsDisplayProps {
  result: {
    success: boolean;
    recordCount?: number;
    data?: any[];
    outputPath?: string;
  };
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  const downloadCSV = () => {
    // 実際の実装では、生成されたファイルをダウンロードします
    // デモ用にサンプルCSVを作成
    const headers = [
      'お客様管理番号', '送り状種類', 'クール区分', '配達指定日', '配達指定時間',
      '発送元郵便番号', '発送元住所', '発送元名前', '発送元電話番号',
      '配送先郵便番号', '配送先住所', '配送先名前', '配送先電話番号',
      '品名', '個数', '重量', 'サイズ', '代金引換', '配送方法', '備考'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    if (result.data) {
      result.data.forEach(row => {
        const values = [
          row.customer_reference_number || '',
          row.shipping_label_type || '',
          row.cool_delivery_classification || '',
          row.delivery_date || '',
          row.delivery_time_code || '',
          row.sender_postal_code || '',
          row.sender_address || '',
          row.sender_name || '',
          row.sender_phone || '',
          row.recipient_postal_code || '',
          row.recipient_address || '',
          row.recipient_name || '',
          row.recipient_phone || '',
          row.product_name || '',
          row.quantity || '',
          row.weight || '',
          row.size_category || '',
          row.cash_on_delivery || '',
          row.shipping_method || '',
          row.notes || ''
        ];
        csvContent += values.map(val => `"${val}"`).join(',') + '\n';
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `yamato_labels_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
        <div className="flex items-center">
          <CheckCircle className="h-8 w-8 text-white mr-3" />
          <div>
            <h3 className="text-xl font-semibold text-white">
              変換が完了しました！
            </h3>
            <p className="text-green-100">
              CSVファイルがヤマト運輸形式に正常に変換されました
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">処理件数</h4>
            <p className="text-2xl font-bold text-blue-600">{result.recordCount || 0} 件</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">ステータス</h4>
            <p className="text-lg font-semibold text-green-600">完了</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">出力形式</h4>
            <p className="text-lg font-semibold text-purple-600">ヤマト運輸CSV</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={downloadCSV}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1"
          >
            <Download className="h-5 w-5 mr-2" />
            ヤマト運輸送り状CSVをダウンロード
          </button>
        </div>

        {result.data && result.data.length > 0 && (
          <div className="mt-8">
            <h4 className="font-semibold text-gray-900 mb-4">プレビュー（最初の5件）</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注文ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配送先名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">住所</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配達指定日</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.data.slice(0, 5).map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.customer_reference_number}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.recipient_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.recipient_address}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.delivery_date || '指定なし'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          処理済み
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}