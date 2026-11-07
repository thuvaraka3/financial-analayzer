import { useState, useRef } from 'react';
import api from '../api';
import { Camera, Upload, FileText, CheckCircle, X, Loader } from 'lucide-react';

export default function ReceiptScanner({ page, setPage }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setError('');
    setResult(null);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/receipts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error processing receipt');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (data) => {
    try {
      await api.post('/transactions', {
        type: 'expense',
        category: data.category || 'Other',
        amount: data.amount,
        date: data.date || new Date().toISOString().split('T')[0],
        description: `Receipt: ${data.merchantName || 'Unknown'} - ${data.description || ''}`,
      });
      setResult(null);
      setFile(null);
      setPreview(null);
      alert('Transaction created from receipt!');
    } catch (err) {
      alert('Error creating transaction');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Receipt Scanner</h1>
        <p className="text-slate-500">Upload a receipt image to extract data automatically</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-8 lg:p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition"
          >
            {preview ? (
              <img src={preview} alt="Receipt preview" className="max-h-64 mx-auto rounded-xl" />
            ) : (
              <>
                <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">Click to upload receipt image</p>
                <p className="text-xs text-slate-400">Supports PNG, JPG, JPEG, BMP, WEBP</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />
          </div>

          {file && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600 truncate max-w-[200px]">{file.name}</span>
                </div>
                <button onClick={() => { setFile(null); setPreview(null); setResult(null); }} className="p-1 hover:bg-slate-200 rounded">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? <><Loader className="w-5 h-5 animate-spin" /> Processing...</> : <><Upload className="w-5 h-5" /> Scan Receipt</>}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Extracted Data</h3>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Receipt scanned successfully</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {result.extractedData?.merchantName && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Merchant</p>
                    <p className="font-medium text-slate-800">{result.extractedData.merchantName}</p>
                  </div>
                )}
                {result.extractedData?.amount && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Amount</p>
                    <p className="font-medium text-slate-800">LKR {Number(result.extractedData.amount).toLocaleString()}</p>
                  </div>
                )}
                {result.extractedData?.date && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Date</p>
                    <p className="font-medium text-slate-800">{result.extractedData.date}</p>
                  </div>
                )}
                {result.extractedData?.category && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Category</p>
                    <p className="font-medium text-slate-800">{result.extractedData.category}</p>
                  </div>
                )}
              </div>

              {result.extractedData?.items && result.extractedData.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Items</p>
                  <div className="flex flex-wrap gap-2">
                    {result.extractedData.items.map((item, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-sm">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleCreateTransaction(result.extractedData)}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition"
              >
                Create Transaction from Receipt
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Upload a receipt to see extracted data here</p>
              <p className="text-xs text-slate-400 mt-2">AI will extract merchant, amount, date, and items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
