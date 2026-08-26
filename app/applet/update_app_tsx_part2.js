import fs from 'fs';
import path from 'path';

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
let appTsx = fs.readFileSync(appPath, 'utf8');

// 1. Rewrite handleAddShoppingSubmit
const oldAddShop = appTsx.indexOf("const handleAddShoppingSubmit = (e: React.FormEvent) => {");
if (oldAddShop !== -1) {
  const newAddShopCode = `const handleAddShoppingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoppingForm.item.trim()) {
      showToast('請填寫欲購買的品項名稱！', 'error');
      return;
    }
    const finalStore = shoppingForm.store === 'custom' ? (shoppingForm.customStore.trim() || '隨意') : shoppingForm.store;
    const finalDeadline = shoppingForm.deadline === 'custom' ? (shoppingForm.customDeadline.trim() || '儘快') : shoppingForm.deadline;
    const isEdit = !!shoppingForm.id;
    const itemObj: any = {
      id: shoppingForm.id || Date.now(),
      category: shoppingForm.category,
      item: shoppingForm.item.trim(),
      store: finalStore,
      deadline: finalDeadline,
      creator: shoppingForm.creator,
      note: shoppingForm.note.trim()
    };

    setLoading(true);
    const action = isEdit ? 'updateShoppingItem' : 'addShoppingItem';
    const res = await callGasApi(action, itemObj);
    setLoading(false);

    if (isEdit) {
      setShoppingItems(prev => prev.map(s => String(s.id) === String(itemObj.id) ? { ...s, ...itemObj } : s));
      showToast(\`已成功更新採購筆記「\${shoppingForm.item}」！\`, 'success');
    } else {
      setShoppingItems(prev => [itemObj, ...prev]);
      showToast(\`已成功新增「\${shoppingForm.item}」至採購清單！\`, 'success');
    }

    setIsAddShoppingOpen(false);
    setIsAddOpen(false);
    setShoppingForm({
      id: '',
      category: '需要買',
      item: '',
      store: '全聯',
      customStore: '',
      deadline: '本週',
      customDeadline: '',
      creator: '廖尹丞',
      note: ''
    });
  };`;

  const oldAddShopEnd = appTsx.indexOf("  };", oldAddShop + 1000);
  appTsx = appTsx.substring(0, oldAddShop) + newAddShopCode + appTsx.substring(oldAddShopEnd + 4);
  console.log('Replaced handleAddShoppingSubmit');
}

// 2. Rewrite handleToggleShoppingStatus
const oldToggle = appTsx.indexOf("const handleToggleShoppingStatus = (id: string, currentStatus: string) => {");
if (oldToggle !== -1) {
  const newToggleCode = `const handleToggleShoppingStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === '已買到' ? '待購買' : '已買到';
    if (selectedShoppingDetail && String(selectedShoppingDetail.id) === String(id)) {
      setSelectedShoppingDetail({
        ...selectedShoppingDetail,
        status: newStatus as any
      });
    }

    setShoppingItems(prev => prev.map(item => String(item.id) === String(id) ? { ...item, status: newStatus as any } : item));

    const res = await callGasApi('toggleShoppingItemStatus', { id, status: newStatus });
    showToast(newStatus === '已買到' ? '🎉 已勾選為「已買到」！' : '已重置狀態為「待購買」！', 'success');
  };`;

  const oldToggleEnd = appTsx.indexOf("  };", oldToggle + 200);
  appTsx = appTsx.substring(0, oldToggle) + newToggleCode + appTsx.substring(oldToggleEnd + 4);
  console.log('Replaced handleToggleShoppingStatus');
}

// 3. Rewrite handleDeleteShoppingItem
const oldDelShop = appTsx.indexOf("const handleDeleteShoppingItem = (id: string, name: string) => {");
if (oldDelShop !== -1) {
  const newDelShopCode = `const handleDeleteShoppingItem = (id: string, name: string) => {
    setCustomConfirmState({
      isOpen: true,
      title: '🗑️ 確認要刪除此筆購物記事嗎？',
      message: \`確定要刪除「\${name}」這筆購物記事嗎？刪除後將無法還原。\`,
      confirmText: '確定刪除',
      cancelText: '取消',
      onConfirm: async () => {
        setCustomConfirmState(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        await callGasApi('deleteShoppingItem', { id });
        setLoading(false);

        setShoppingItems(prev => prev.filter(item => String(item.id) !== String(id)));
        showToast(\`已刪除購物記事「\${name}」\`, 'info');
      }
    });
  };`;

  const oldDelShopEnd = appTsx.indexOf("  };", oldDelShop + 200);
  appTsx = appTsx.substring(0, oldDelShop) + newDelShopCode + appTsx.substring(oldDelShopEnd + 4);
  console.log('Replaced handleDeleteShoppingItem');
}

// 4. Rewrite handleClearDoneItems
const oldClearDone = appTsx.indexOf("const handleClearDoneItems = () => {");
if (oldClearDone !== -1) {
  const newClearDoneCode = `const handleClearDoneItems = async () => {
    setIsClearDoneConfirmOpen(false);
    setLoading(true);
    await callGasApi('clearDoneShoppingItems');
    setLoading(false);

    setShoppingItems(prev => prev.filter(item => item.status !== '已買到'));
    showToast('已清理所有「已買到」的採購項目！', 'success');
  };`;

  const oldClearDoneEnd = appTsx.indexOf("  };", oldClearDone + 100);
  appTsx = appTsx.substring(0, oldClearDone) + newClearDoneCode + appTsx.substring(oldClearDoneEnd + 4);
  console.log('Replaced handleClearDoneItems');
}

// 5. Rewrite saveStoresToBackend
const oldSaveStores = appTsx.indexOf("const saveStoresToBackend = (updated: string[]) => {");
if (oldSaveStores !== -1) {
  const newSaveStoresCode = `const saveStoresToBackend = async (updated: string[]) => {
    setShoppingStores(updated);
    localStorage.setItem('muji_shopping_stores', JSON.stringify(updated));
    await callGasApi('saveStoresList', { stores: updated });
  };`;

  const oldSaveStoresEnd = appTsx.indexOf("  };", oldSaveStores + 100);
  appTsx = appTsx.substring(0, oldSaveStores) + newSaveStoresCode + appTsx.substring(oldSaveStoresEnd + 4);
  console.log('Replaced saveStoresToBackend');
}

fs.writeFileSync(appPath, appTsx, 'utf8');
console.log('App.tsx part 2 updated!');
