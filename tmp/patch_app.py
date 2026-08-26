import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

pos1 = text.find('const handleSubmit = (e: React.FormEvent) => {')
pos2 = text.find('showToast(`已成功記錄', pos1)
pos3 = text.find('};', pos2) + 2

old_block = text[pos1:pos3]

new_block = '''const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item.trim()) {
      showToast('請輸入款項項目名稱', 'error');
      return;
    }
    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('款項金額必須是正整數或大於 0 的數值', 'error');
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
    const mockTimestamp = `${nowObj.getFullYear()}-${pad(nowObj.getMonth() + 1)}-${pad(nowObj.getDate())} ${pad(nowObj.getHours())}:${pad(nowObj.getMinutes())}:${pad(nowObj.getSeconds())}`;
    
    const newRow: RecordItem = {
      id: Date.now(),
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
    const updated = [newRow, ...records];
    saveRecordsToLocal(updated);
        
    const isExpense = formData.type.startsWith('支出');
    const currObj = CURRENCIES.find(c => c.code === selectedCurrency);
    const foreignStr = selectedCurrency !== 'TWD'
      ? ` (原幣 ${currObj?.flag || ''} ${numAmount.toLocaleString('zh-TW')} ${selectedCurrency}, 匯率 ${effectiveRate})`
      : '';
    const notifTitle = isExpense 
      ? `💸 ${formData.payer} 新增了日常代墊${selectedCurrency !== 'TWD' ? ' (外幣)' : ''}`
      : `💰 ${formData.payer} 撥入了公積金`;
    const notifDesc = `「${formData.item.trim()}」：金額 $${twdAmount.toLocaleString('zh-TW')} 元${foreignStr} (${monthStr} 月份)`;
    addNotificationAndSave(notifTitle, notifDesc, isExpense ? 'expense' : 'income');

    setFormData({
      item: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      payer: '廖尹丞',
      type: '支出-日常代墊',
      currency: 'TWD',
      customRate: ''
    });
    
    showToast(`已成功記錄「${formData.item.trim()}」 (折合台幣 $${twdAmount.toLocaleString('zh-TW')} 元)`, 'success');
  };'''

text = text[:pos1] + new_block + text[pos3:]

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated handleSubmit via script successfully!')
