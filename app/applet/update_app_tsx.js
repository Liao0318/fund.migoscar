import fs from 'fs';
import path from 'path';

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
let appTsx = fs.readFileSync(appPath, 'utf8');

// 1. Insert editingRecord, gasWebUrl, callGasApi, fetchDashboardData, fetchShoppingData
const stateInsertPoint = appTsx.indexOf("const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);");

const newStatesAndGasApi = `
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [gasWebUrl, setGasWebUrl] = useState(() => localStorage.getItem('muji_gas_web_url') || '');
  const [isSyncingGas, setIsSyncingGas] = useState(false);

  // ------------------- Google Apps Script / Web App API 整合核心 -------------------
  const callGasApi = async (action: string, payload?: any): Promise<any> => {
    // 1. 原生 Google Apps Script iframe 環境
    if (typeof window !== 'undefined' && (window as any).google?.script?.run) {
      return new Promise((resolve) => {
        const runner = (window as any).google.script.run
          .withSuccessHandler((res: any) => resolve(res))
          .withFailureHandler((err: any) => resolve({ success: false, error: String(err) }));
        if (typeof runner[action] === 'function') {
          runner[action](payload);
        } else {
          resolve({ success: false, error: \`Function \${action} not found\` });
        }
      });
    }

    // 2. AI Studio 預覽版或獨立 Web 網頁環境，透過 HTTP fetch 呼叫 GAS Web App
    const targetUrl = localStorage.getItem('muji_gas_web_url') || gasWebUrl;
    if (targetUrl && targetUrl.trim().startsWith('http')) {
      try {
        const res = await fetch(targetUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, ...payload })
        });
        const data = await res.json();
        return data;
      } catch (err) {
        console.warn(\`callGasApi HTTP POST to \${action} failed:\`, err);
      }
    }

    return { success: false, isLocalFallback: true };
  };

  const fetchDashboardData = async (showToastNotice = false) => {
    setIsSyncingGas(true);
    try {
      const res = await callGasApi('getDashboardData');
      if (res && res.success) {
        if (Array.isArray(res.records) && res.records.length > 0) {
          setRecords(res.records);
          localStorage.setItem('muji_ledger_data', JSON.stringify(res.records));
        }
        if (Array.isArray(res.reconciledMonths)) {
          setReconciledMonths(res.reconciledMonths);
          localStorage.setItem('muji_reconciled_months', JSON.stringify(res.reconciledMonths));
        }
        if (showToastNotice) {
          showToast('🎉 已成功從 Google 試算表抓取最新對帳資料！', 'success');
        }
      } else if (showToastNotice) {
        showToast('⚡ 本機離線模式（若需雲端同步，請於右下角「設定部署」輸入 Web App URL）', 'info');
      }
    } catch (err) {
      console.warn('fetchDashboardData error:', err);
    } finally {
      setIsSyncingGas(false);
    }
  };

  const fetchShoppingData = async () => {
    try {
      const res = await callGasApi('getShoppingData');
      if (res && res.success) {
        if (Array.isArray(res.items)) {
          setShoppingItems(res.items);
          localStorage.setItem('muji_shopping_items', JSON.stringify(res.items));
        }
        if (Array.isArray(res.stores) && res.stores.length > 0) {
          setShoppingStores(res.stores);
          localStorage.setItem('muji_shopping_stores', JSON.stringify(res.stores));
        }
      }
    } catch (err) {
      console.warn('fetchShoppingData error:', err);
    }
  };
`;

if (stateInsertPoint !== -1) {
  appTsx = appTsx.substring(0, stateInsertPoint) + newStatesAndGasApi + '\n  ' + appTsx.substring(stateInsertPoint);
  console.log('Inserted new states and callGasApi');
}

// 2. Add useEffect to fetch live data on mount
const eff1Idx = appTsx.indexOf("useEffect(() => {\n    fetchLiveExchangeRates(false);\n  }, []);");
if (eff1Idx !== -1) {
  const newMountEffect = `useEffect(() => {
    fetchLiveExchangeRates(false);
    fetchDashboardData(false);
    fetchShoppingData();
  }, []);`;
  appTsx = appTsx.replace("useEffect(() => {\n    fetchLiveExchangeRates(false);\n  }, []);", newMountEffect);
  console.log('Updated mount useEffect with fetchDashboardData & fetchShoppingData');
}

// 3. Add handleEditRecord & handleOpenAddRecordModal
const openAddModalPos = appTsx.indexOf("const handleOpenAddModal =");
const handleOpenAddModalCode = `
  const handleEditRecord = (record: RecordItem) => {
    setEditingRecord(record);
    setFormData({
      item: record.item,
      amount: String(record.originalAmount || record.amount),
      currency: record.currency || 'TWD',
      customRate: String(record.exchangeRate || (exchangeRates[record.currency || 'TWD'] || '')),
      date: record.date || new Date().toISOString().split('T')[0],
      payer: record.payer,
      type: record.type
    });
    setAddModalType('record');
    setIsAddOpen(true);
  };

  const handleOpenAddRecordModal = () => {
    setEditingRecord(null);
    setFormData({
      item: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payer: '廖尹丞',
      type: '支出-日常代墊',
      currency: 'TWD',
      customRate: ''
    });
    setAddModalType('record');
    setIsAddOpen(true);
  };
`;

if (openAddModalPos !== -1) {
  appTsx = appTsx.substring(0, openAddModalPos) + handleOpenAddModalCode + '\n  ' + appTsx.substring(openAddModalPos);
  console.log('Added handleEditRecord & handleOpenAddRecordModal');
}

// 4. Update handleSubmit for Accounting Record to support Edit & Add via callGasApi
const oldSubmitStart = appTsx.indexOf("const handleSubmit = (e: React.FormEvent) => {");
const oldSubmitEnd = appTsx.indexOf("setToast({ message: '本機快取已更新！', type: 'success' });", oldSubmitStart);
if (oldSubmitStart !== -1) {
  const newHandleSubmitCode = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item.trim()) {
      showToast('請輸入款項項目名稱', 'error');
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('款項金額必須是正數或大於 0 的數值', 'error');
      return;
    }
    const selectedCurrency = formData.currency || 'TWD';
    const effectiveRate = selectedCurrency === 'TWD'
      ? 1
      : (parseFloat(formData.customRate) || exchangeRates[selectedCurrency] || DEFAULT_RATES_MAP[selectedCurrency] || 1);
    const twdAmount = selectedCurrency === 'TWD' ? numAmount : Math.round(numAmount * effectiveRate);
    const selectedDateStr = formData.date || new Date().toISOString().split('T')[0];
    const monthStr = selectedDateStr.substring(0, 7);
    const nowObj = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const mockTimestamp = \`\${nowObj.getFullYear()}-\${pad(nowObj.getMonth() + 1)}-\${pad(nowObj.getDate())} \${pad(nowObj.getHours())}:\${pad(nowObj.getMinutes())}:\${pad(nowObj.getSeconds())}\`;

    const recordData: RecordItem = {
      id: editingRecord ? editingRecord.id : Date.now(),
      month: monthStr,
      date: selectedDateStr,
      item: formData.item.trim(),
      payer: formData.payer,
      amount: twdAmount,
      type: formData.type,
      timestamp: mockTimestamp,
      currency: selectedCurrency,
      originalAmount: numAmount,
      exchangeRate: Number(effectiveRate.toFixed(4))
    };

    setLoading(true);

    if (editingRecord) {
      // 編輯既有項目
      await callGasApi('updateRecordByRow', recordData);
      setLoading(false);

      const updated = records.map(r => r.id === editingRecord.id ? { ...r, ...recordData } : r);
      setRecords(updated);
      saveRecordsToLocal(updated);

      setIsAddOpen(false);
      setEditingRecord(null);
      showToast('✨ 對帳項目修改完成並同步試算表！', 'success');
    } else {
      // 新增項目
      await callGasApi('addRecord', recordData);
      setLoading(false);

      const updated = [recordData, ...records];
      setRecords(updated);
      saveRecordsToLocal(updated);

      const isExpense = formData.type.startsWith('支出');
      const currObj = CURRENCIES.find(c => c.code === selectedCurrency);
      const foreignStr = selectedCurrency !== 'TWD'
        ? \` (原幣 \${currObj?.flag || ''} \${numAmount.toLocaleString('zh-TW')} \${selectedCurrency}, 匯率 \${effectiveRate})\`
        : '';
      const notifTitle = isExpense 
        ? \`💸 \${formData.payer} 新增了日常代墊\${selectedCurrency !== 'TWD' ? ' (外幣)' : ''}\`
        : \`💰 \${formData.payer} 撥入了公積金\`;
      const notifDesc = \`「\${formData.item.trim()}」：金額 $\${twdAmount.toLocaleString('zh-TW')} 元\${foreignStr} (\${monthStr} 月份)\`;
      addNotificationAndSave(notifTitle, notifDesc, isExpense ? 'expense' : 'income');

      setIsAddOpen(false);
      showToast('對帳項目登錄成功並同步 Google 試算表！', 'success');
    }

    setFormData({
      item: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payer: '廖尹丞',
      type: '支出-日常代墊',
      currency: 'TWD',
      customRate: ''
    });
  };`;

  const handleSubmitBlockEnd = appTsx.indexOf("  };", oldSubmitStart + 100);
  appTsx = appTsx.substring(0, oldSubmitStart) + newHandleSubmitCode + appTsx.substring(handleSubmitBlockEnd + 4);
  console.log('Replaced handleSubmit with Edit/Add support & Google Sheets call');
}

// 5. Update handleDelete for Accounting Record
const oldDeleteStart = appTsx.indexOf("const handleDelete = (id: string | number) => {");
if (oldDeleteStart !== -1) {
  const newHandleDeleteCode = `const handleDelete = (id: string | number) => {
    const itemToDelete = records.find(r => String(r.id) === String(id));
    const itemName = itemToDelete ? itemToDelete.item : '此項目';

    setCustomConfirmState({
      isOpen: true,
      title: '🗑️ 確認要刪除此筆對帳紀錄嗎？',
      message: \`您確定要刪除「\${itemName}」嗎？這會自 Google 試算表永久移去資料。\`,
      confirmText: '永久刪除',
      cancelText: '保留紀錄',
      onConfirm: async () => {
        setCustomConfirmState(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        await callGasApi('deleteRecordByRow', { id, rowId: id });
        setLoading(false);

        const filtered = records.filter(r => String(r.id) !== String(id));
        setRecords(filtered);
        saveRecordsToLocal(filtered);

        addNotificationAndSave('🗑️ 刪除了對帳紀錄', \`「\${itemName}」已被移除\`, 'delete');
        showToast('已成功刪除該筆對帳紀錄並同步試算表！', 'success');
      }
    });
  };`;

  const handleDeleteEnd = appTsx.indexOf("  };", oldDeleteStart + 50);
  appTsx = appTsx.substring(0, oldDeleteStart) + newHandleDeleteCode + appTsx.substring(handleDeleteEnd + 4);
  console.log('Replaced handleDelete with Google Sheets call');
}

fs.writeFileSync(appPath, appTsx, 'utf8');
console.log('App.tsx part 1 updated!');
