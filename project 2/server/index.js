import express from 'express';
import multer from 'multer';
import cors from 'cors';
import csv from 'csv-parser';
import { createReadStream, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import { processCSVData } from './csvProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());

// 静的ファイルの配信（本番環境用）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
}

// ファイルアップロード用のmulter設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB制限
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('CSVファイルのみアップロード可能です'));
    }
  }
});

// アップロードディレクトリが存在しない場合は作成
try {
  mkdirSync('uploads');
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

// ルートルート
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(join(__dirname, '../dist/index.html'));
  } else {
    res.json({
      message: 'ヤマト運輸CSV変換ツール API',
      version: '1.0.0',
      endpoints: {
        upload: 'POST /api/upload',
        preview: 'POST /api/preview',
        templates: 'GET /api/templates/:type'
      }
    });
  }
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ファイルアップロードエンドポイント
app.post('/api/upload', upload.fields([
  { name: 'orders', maxCount: 1 },
  { name: 'customers', maxCount: 1 },
  { name: 'shipping', maxCount: 1 },
  { name: 'products', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files;
    
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }

    // CSVファイルを解析
    const csvData = {};
    const requiredFiles = ['orders', 'customers', 'shipping', 'products'];
    
    for (const fileType of requiredFiles) {
      if (!files[fileType]) {
        return res.status(400).json({ error: `${fileType}ファイルが不足しています` });
      }
      
      const filePath = files[fileType][0].path;
      csvData[fileType] = await parseCSV(filePath);
      
      // アップロードされたファイルを削除
      unlinkSync(filePath);
    }

    // データを処理・変換
    const result = await processCSVData(csvData);
    
    res.json(result);
  } catch (error) {
    console.error('アップロードエラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// CSVプレビューエンドポイント
app.post('/api/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }

    const data = await parseCSV(req.file.path, 5); // プレビュー用に5行に制限
    unlinkSync(req.file.path);
    
    res.json({ data, headers: Object.keys(data[0] || {}) });
  } catch (error) {
    console.error('プレビューエラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// サンプルテンプレートエンドポイント
app.get('/api/templates/:type', (req, res) => {
  const { type } = req.params;
  
  const templates = {
    orders: 'order_id,order_date,product_code,quantity,customer_code,delivery_postal_code,delivery_address,delivery_name,delivery_phone\nORD001,2024-01-15,PRD001,2,CUST001,100-0001,東京都千代田区千代田1-1,田中太郎,03-1234-5678',
    customers: 'customer_code,customer_name,customer_postal_code,customer_address,customer_phone,delivery_type\nCUST001,株式会社サンプル,100-0002,東京都千代田区丸の内1-1,03-1234-5678,standard',
    shipping: 'order_id,desired_delivery_date,desired_delivery_time,shipping_method,cash_on_delivery,notes\nORD001,2024-01-20,午前中,standard,0,通常配送',
    products: 'product_code,product_name,weight,size_category,unit_price,category,packaging_type\nPRD001,サンプル商品,500,S,1000,electronics,box'
  };

  const fileNames = {
    orders: '注文データ.csv',
    customers: '顧客マスタ.csv',
    shipping: '配送設定.csv',
    products: '商品マスタ.csv'
  };

  if (!templates[type]) {
    return res.status(404).json({ error: 'テンプレートが見つかりません' });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileNames[type])}`);
  res.send('\uFEFF' + templates[type]); // BOM付きでUTF-8エンコーディング
});

// 本番環境用のキャッチオール（SPAルーティング対応）
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

function parseCSV(filePath, limit = null) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;
    
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        if (limit && count >= limit) return;
        results.push(data);
        count++;
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
});
