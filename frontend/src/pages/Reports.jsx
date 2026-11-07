import { useState, useEffect } from 'react';
import api from '../api';
import { FileText, Download, Sparkles, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports({ page, setPage }) {
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await api.get('/reports/list');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (month) => {
    setGenerating(true);
    try {
      const res = await api.post('/reports/generate', { month });
      setCurrentReport(res.data.report);
      loadReports();
    } catch (err) {
      alert('Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
          <p className="text-slate-500">AI-generated monthly financial summaries</p>
        </div>
        <button
          onClick={() => generateReport(currentMonth)}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition font-medium"
        >
          <Sparkles className="w-5 h-5" />
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Generated Reports</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (<div key={i} className="h-16 bg-slate-100 rounded-xl"></div>))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No reports yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <button
                  key={report.id || report.reportId}
                  onClick={() => setCurrentReport(report)}
                  className={`w-full text-left p-4 rounded-xl transition ${
                    currentReport?.month === report.month ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{report.month}</p>
                      <p className="text-xs text-slate-500">{report.generatedAt?.slice(0, 10)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          {currentReport ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">
                  Report for {currentReport.month}
                </h3>

              </div>
              <div className="prose prose-sm max-w-none">
                <div className="bg-slate-50 rounded-xl p-6 whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {currentReport.reportContent}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No Report Selected</h3>
              <p className="text-slate-400">Generate a report or select one from the list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
