/**
 * Google Drive 專屬帳本設定雲端同步模組 (跟隨 Google 帳戶跨裝置無縫同步)
 * 透過 Google OAuth 授權權杖 (drive.file scope)，直接將資料庫連線設定儲存於使用者個人的 Google Drive
 * 任何裝置 (手機、筆電、平板) 只要使用同一個 Google 帳號登入，即可自動抓取資料庫網址，達成真正的「一次設定，全裝置跟隨 Google 帳號同步」
 */

export interface GoogleDriveLedgerConfig {
  gasWebUrl: string;
  deploySheetUrl?: string;
  inviteCode?: string;
  userEmail: string;
  updatedAt: string;
  version: number;
}

const CONFIG_FILE_NAME = 'banban_ledger_sync_config.json';

/**
 * 在使用者的 Google Drive 中搜尋既有的伴伴記資料庫設定檔
 */
export async function findConfigFileInGoogleDrive(accessToken: string): Promise<string | null> {
  if (!accessToken) return null;
  try {
    const q = encodeURIComponent(`name = '${CONFIG_FILE_NAME}' and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)&pageSize=1`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      console.warn('[GoogleDriveSync] 搜尋設定檔失敗:', res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.warn('[GoogleDriveSync] 查詢 Google Drive 異常:', err);
    return null;
  }
}

/**
 * 自使用者的 Google Drive 下載並讀取資料庫設定 (換機/手機登入時核心調用)
 */
export async function loadConfigFromGoogleDrive(accessToken: string): Promise<GoogleDriveLedgerConfig | null> {
  if (!accessToken) return null;
  try {
    const fileId = await findConfigFileInGoogleDrive(accessToken);
    if (!fileId) {
      console.log('[GoogleDriveSync] Google Drive 中尚無設定檔，此為首次雲端同步');
      return null;
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      console.warn('[GoogleDriveSync] 下載設定檔失敗:', res.status);
      return null;
    }

    const config = (await res.json()) as GoogleDriveLedgerConfig;
    if (config && config.gasWebUrl && config.gasWebUrl.startsWith('http')) {
      console.log('[GoogleDriveSync] 成功從 Google Drive 載入資料庫設定:', config.gasWebUrl);
      return config;
    }
    return null;
  } catch (err) {
    console.warn('[GoogleDriveSync] 讀取 Google Drive 設定異常:', err);
    return null;
  }
}

/**
 * 將資料庫設定儲存或更新至使用者的 Google Drive (電腦或任一裝置配置時核心調用)
 */
export async function saveConfigToGoogleDrive(
  accessToken: string,
  config: {
    gasWebUrl: string;
    deploySheetUrl?: string;
    inviteCode?: string;
    userEmail: string;
  }
): Promise<boolean> {
  if (!accessToken || !config.gasWebUrl || !config.gasWebUrl.startsWith('http')) {
    return false;
  }

  try {
    const existingFileId = await findConfigFileInGoogleDrive(accessToken);
    const payload: GoogleDriveLedgerConfig = {
      gasWebUrl: config.gasWebUrl.trim(),
      deploySheetUrl: (config.deploySheetUrl || '').trim(),
      inviteCode: (config.inviteCode || '').trim(),
      userEmail: (config.userEmail || '').trim().toLowerCase(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    const fileContent = JSON.stringify(payload, null, 2);

    if (existingFileId) {
      // 更新既有檔案內容
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        }
      );

      if (updateRes.ok) {
        console.log('[GoogleDriveSync] 成功更新 Google Drive 中的伴伴記設定檔');
        return true;
      } else {
        console.warn('[GoogleDriveSync] 更新檔案失敗:', updateRes.status);
      }
    } else {
      // 建立新檔案 (Multipart Upload 包含 Metadata 與內容)
      const metadata = {
        name: CONFIG_FILE_NAME,
        mimeType: 'application/json',
        description: '伴伴記情侶記帳 - 跨裝置 Google 帳號自動同步資料庫設定檔',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const createRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (createRes.ok) {
        console.log('[GoogleDriveSync] 成功於使用者 Google Drive 建立伴伴記設定檔！');
        return true;
      } else {
        console.warn('[GoogleDriveSync] 建立檔案失敗:', createRes.status);
      }
    }
  } catch (err) {
    console.warn('[GoogleDriveSync] 儲存設定至 Google Drive 失敗:', err);
  }
  return false;
}
