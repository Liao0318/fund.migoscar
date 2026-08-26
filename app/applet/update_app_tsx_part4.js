import fs from 'fs';
import path from 'path';

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
let appTsx = fs.readFileSync(appPath, 'utf8');

const targetSlice = `{r.currency && r.currency !== 'TWD' && (
                                <span className="text-[9px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 font-mono block mt-0.5">
                                  {CURRENCIES.find(c => c.code === r.currency)?.flag} {r.originalAmount?.toLocaleString('zh-TW')} {r.currency}
                                </span>
                              )}
                            </div>
                          </div>`;

const replacementSlice = `{r.currency && r.currency !== 'TWD' && (
                                <span className="text-[9px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 font-mono block mt-0.5">
                                  {CURRENCIES.find(c => c.code === r.currency)?.flag} {r.originalAmount?.toLocaleString('zh-TW')} {r.currency}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEditRecord(r)}
                                className="text-[#8C8475] hover:text-[#4A4641] p-1.5 rounded-lg hover:bg-gray-100 transition-all border border-transparent cursor-pointer"
                                title="編輯對帳紀錄"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="text-[#A59F94] hover:text-[#C55757] p-1.5 rounded-lg hover:bg-red-50 hover:border-red-100 transition-all border border-transparent cursor-pointer"
                                title="移除對帳紀錄"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>`;

if (appTsx.includes(targetSlice)) {
  appTsx = appTsx.replace(targetSlice, replacementSlice);
  console.log('Added action buttons to Home tab recent records');
} else {
  console.log('targetSlice not found, checking alternative spacing...');
  // Let's do regex replace
  const regex = /({r\.currency && r\.currency !== 'TWD' && \([\s\S]*?<\/span>\s*\)\}\s*<\/div>\s*)(<\/div>)/;
  if (regex.test(appTsx)) {
    appTsx = appTsx.replace(regex, `$1<div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEditRecord(r)}
                                className="text-[#8C8475] hover:text-[#4A4641] p-1.5 rounded-lg hover:bg-gray-100 transition-all border border-transparent cursor-pointer"
                                title="編輯對帳紀錄"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="text-[#A59F94] hover:text-[#C55757] p-1.5 rounded-lg hover:bg-red-50 hover:border-red-100 transition-all border border-transparent cursor-pointer"
                                title="移除對帳紀錄"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>$2`);
    console.log('Regex replaced action buttons in Home tab recent records');
  }
}

fs.writeFileSync(appPath, appTsx, 'utf8');
console.log('App.tsx part 4 updated!');
