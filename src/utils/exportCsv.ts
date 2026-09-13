import { RecordItem, SplitRecordItem } from '../types';

/**
 * 匯出公積金帳目為 CSV 檔案
 */
export function exportFundRecordsToCSV(records: RecordItem[], filename = '伴伴記_公積金記帳明細.csv') {
  if (!records || records.length === 0) {
    alert('目前沒有可匯出的紀錄');
    return;
  }

  const headers = ['流水號', '月份', '日期', '記帳類別', '出資/代墊人', '品項名稱', '折合台幣(TWD)', '原幣幣別', '原幣金額', '匯率', '建檔時間'];
  
  const rows = records.map(r => [
    `"${r.id}"`,
    `"${r.month || ''}"`,
    `"${r.date || ''}"`,
    `"${r.type || ''}"`,
    `"${r.payer || ''}"`,
    `"${(r.item || '').replace(/"/g, '""')}"`,
    r.amount || 0,
    `"${r.currency || 'TWD'}"`,
    r.originalAmount || r.amount || 0,
    r.exchangeRate || 1,
    `"${r.timestamp || ''}"`
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  downloadBlob(csvContent, 'text/csv;charset=utf-8;', filename);
}

/**
 * 匯出代墊借還明細為 CSV 檔案
 */
export function exportSplitRecordsToCSV(items: SplitRecordItem[], filename = '伴伴記_代墊借還明細.csv') {
  if (!items || items.length === 0) {
    alert('目前沒有可匯出的紀錄');
    return;
  }

  const headers = ['編號', '記帳時間', '付款人(先付)', '分攤模式', '品項名稱', '消費總額(TWD)', '應還人', '應還金額(TWD)', '結算狀態', '結清時間', '備註'];

  const rows = items.map(item => [
    `"${item.id}"`,
    `"${item.time || ''}"`,
    `"${item.payer || ''}"`,
    `"${item.splitMode || ''}"`,
    `"${(item.itemName || '').replace(/"/g, '""')}"`,
    item.totalAmount || 0,
    `"${item.debtor || ''}"`,
    item.debtorAmount || 0,
    `"${item.status || ''}"`,
    `"${item.settledTime || ''}"`,
    `"${(item.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  downloadBlob(csvContent, 'text/csv;charset=utf-8;', filename);
}

function downloadBlob(content: string, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
