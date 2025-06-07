import { createObjectCsvWriter } from 'csv-writer';
import { join } from 'path';
import { mkdirSync } from 'fs';

export async function processCSVData(csvData) {
  try {
    // 必須列の検証
    validateCSVStructure(csvData);
    
    // データの処理と結合
    const mergedData = mergeCSVData(csvData);
    
    // ヤマト運輸形式に変換
    const yamatoData = convertToYamatoFormat(mergedData);
    
    // 出力CSVの生成
    const outputPath = await generateOutputCSV(yamatoData);
    
    return {
      success: true,
      recordCount: yamatoData.length,
      outputPath,
      data: yamatoData.slice(0, 10), // プレビュー用に最初の10件を返す
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      errors: error.details || []
    };
  }
}

function validateCSVStructure(csvData) {
  const requiredColumns = {
    orders: ['order_id', 'order_date', 'product_code', 'quantity', 'customer_code', 'delivery_postal_code', 'delivery_address', 'delivery_name', 'delivery_phone'],
    customers: ['customer_code', 'customer_name', 'customer_postal_code', 'customer_address', 'customer_phone', 'delivery_type'],
    shipping: ['order_id', 'desired_delivery_date', 'desired_delivery_time', 'shipping_method', 'cash_on_delivery', 'notes'],
    products: ['product_code', 'product_name', 'weight', 'size_category', 'unit_price', 'category', 'packaging_type']
  };

  const errors = [];

  for (const [fileType, data] of Object.entries(csvData)) {
    if (!data || data.length === 0) {
      errors.push(`${fileType}ファイルが空です`);
      continue;
    }

    const headers = Object.keys(data[0]);
    const required = requiredColumns[fileType] || [];
    
    for (const col of required) {
      if (!headers.includes(col)) {
        errors.push(`${fileType}ファイルに必須列 '${col}' がありません`);
      }
    }
  }

  if (errors.length > 0) {
    const error = new Error('CSV検証に失敗しました');
    error.details = errors;
    throw error;
  }
}

function mergeCSVData(csvData) {
  const { orders, customers, shipping, products } = csvData;
  const mergedData = [];
  const errors = [];

  // 効率的な結合のためのルックアップマップを作成
  const customerMap = new Map(customers.map(c => [c.customer_code, c]));
  const shippingMap = new Map(shipping.map(s => [s.order_id, s]));
  const productMap = new Map(products.map(p => [p.product_code, p]));

  for (const order of orders) {
    try {
      const customer = customerMap.get(order.customer_code);
      const shippingInfo = shippingMap.get(order.order_id);
      const product = productMap.get(order.product_code);

      if (!customer) {
        errors.push(`注文 ${order.order_id} の顧客情報が見つかりません`);
        continue;
      }

      if (!shippingInfo) {
        errors.push(`注文 ${order.order_id} の配送情報が見つかりません`);
        continue;
      }

      if (!product) {
        errors.push(`注文 ${order.order_id} の商品情報が見つかりません`);
        continue;
      }

      mergedData.push({
        ...order,
        ...customer,
        ...shippingInfo,
        ...product
      });
    } catch (error) {
      errors.push(`注文 ${order.order_id} の処理中にエラーが発生しました: ${error.message}`);
    }
  }

  if (errors.length > 0 && mergedData.length === 0) {
    const error = new Error('データ結合に失敗しました');
    error.details = errors;
    throw error;
  }

  return mergedData;
}

function convertToYamatoFormat(data) {
  return data.map(record => {
    // 配送時間コードのマッピング
    const timeCodeMap = {
      '午前中': '01',
      '14-16時': '05',
      '16-18時': '06',
      '18-20時': '07'
    };

    // クール便区分
    const coolDelivery = record.notes && record.notes.includes('冷蔵配送') ? '1' : '0';

    return {
      customer_reference_number: record.order_id,
      shipping_label_type: '0',
      cool_delivery_classification: coolDelivery,
      delivery_date: record.desired_delivery_date || '',
      delivery_time_code: timeCodeMap[record.desired_delivery_time] || '',
      sender_postal_code: record.customer_postal_code || '',
      sender_address: record.customer_address || '',
      sender_name: record.customer_name || '',
      sender_phone: record.customer_phone || '',
      recipient_postal_code: record.delivery_postal_code || '',
      recipient_address: record.delivery_address || '',
      recipient_name: record.delivery_name || '',
      recipient_phone: record.delivery_phone || '',
      product_name: record.product_name || '',
      quantity: record.quantity || '1',
      weight: record.weight || '',
      size_category: record.size_category || '',
      cash_on_delivery: record.cash_on_delivery || '0',
      shipping_method: record.shipping_method || 'standard',
      notes: record.notes || ''
    };
  });
}

async function generateOutputCSV(data) {
  const outputPath = join(process.cwd(), 'output', `yamato_labels_${Date.now()}.csv`);
  
  // 出力ディレクトリが存在しない場合は作成
  try {
    mkdirSync('output');
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  const csvWriter = createObjectCsvWriter({
    path: outputPath,
    header: [
      { id: 'customer_reference_number', title: 'お客様管理番号' },
      { id: 'shipping_label_type', title: '送り状種類' },
      { id: 'cool_delivery_classification', title: 'クール区分' },
      { id: 'delivery_date', title: '配達指定日' },
      { id: 'delivery_time_code', title: '配達指定時間' },
      { id: 'sender_postal_code', title: '発送元郵便番号' },
      { id: 'sender_address', title: '発送元住所' },
      { id: 'sender_name', title: '発送元名前' },
      { id: 'sender_phone', title: '発送元電話番号' },
      { id: 'recipient_postal_code', title: '配送先郵便番号' },
      { id: 'recipient_address', title: '配送先住所' },
      { id: 'recipient_name', title: '配送先名前' },
      { id: 'recipient_phone', title: '配送先電話番号' },
      { id: 'product_name', title: '品名' },
      { id: 'quantity', title: '個数' },
      { id: 'weight', title: '重量' },
      { id: 'size_category', title: 'サイズ' },
      { id: 'cash_on_delivery', title: '代金引換' },
      { id: 'shipping_method', title: '配送方法' },
      { id: 'notes', title: '備考' }
    ]
  });

  await csvWriter.writeRecords(data);
  return outputPath;
}