'use client';

import { useState, useEffect } from 'react';
import { Download, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TableOption {
  key: string;
  name: string;
}

export default function ExportDataPage() {
  const [tables, setTables] = useState<TableOption[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exportStats, setExportStats] = useState<{ table: string; rows: number; timestamp: string } | null>(null);

  // Fetch available tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setIsLoadingTables(true);
      const response = await fetch('/api/admin/export-table');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }

      const data = await response.json();
      setTables(data.tables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setMessage({ type: 'error', text: 'Failed to load available tables' });
    } finally {
      setIsLoadingTables(false);
    }
  };

  const handleExport = async () => {
    if (!selectedTable) {
      setMessage({ type: 'error', text: 'Please select a table to export' });
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);

      const response = await fetch('/api/admin/export-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table: selectedTable }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get row count from headers
      const rowCount = parseInt(response.headers.get('X-Row-Count') || '0');
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `export-${selectedTable}.csv`;

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message
      const tableName = tables.find(t => t.key === selectedTable)?.name || selectedTable;
      setMessage({ 
        type: 'success', 
        text: `Successfully exported ${rowCount.toLocaleString()} rows from ${tableName}` 
      });

      // Update export stats
      setExportStats({
        table: tableName,
        rows: rowCount,
        timestamp: new Date().toLocaleString(),
      });

    } catch (error) {
      console.error('Error exporting table:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to export table' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-[#D4AF3D]" />
            <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
          </div>
          <p className="text-gray-600">
            Export any database table to CSV format for analysis, backup, or migration purposes.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Table Selection */}
          <div className="mb-6">
            <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Table
            </label>
            
            {isLoadingTables ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4AF3D]" />
                <span className="ml-2 text-gray-600">Loading tables...</span>
              </div>
            ) : (
              <select
                id="table-select"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF3D] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Choose a table to export --</option>
                {tables.map((table) => (
                  <option key={table.key} value={table.key}>
                    {table.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={!selectedTable || isLoading}
            className="w-full bg-[#D4AF3D] hover:bg-[#B8941F] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export to CSV
              </>
            )}
          </button>

          {/* Status Message */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}
        </div>

        {/* Export Statistics */}
        {exportStats && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Export</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Table</p>
                <p className="text-lg font-semibold text-gray-900">{exportStats.table}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Rows Exported</p>
                <p className="text-lg font-semibold text-gray-900">
                  {exportStats.rows.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Timestamp</p>
                <p className="text-lg font-semibold text-gray-900">{exportStats.timestamp}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Export Information</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>CSV files can be opened in Excel, Google Sheets, or any spreadsheet application</li>
            <li>Large tables may take a few moments to export</li>
            <li>All exports are logged for security and audit purposes</li>
            <li>Files are automatically named with timestamps for easy organization</li>
            <li>Complex data types (JSON, arrays) are converted to strings in the export</li>
          </ul>
        </div>

        {/* Available Tables Count */}
        {!isLoadingTables && tables.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            {tables.length} tables available for export
          </div>
        )}
      </div>
    </div>
  );
}

