const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const {
    copyFilesToUserDataIfNotExist,
    first_install,
    which_now_id,
    input_a_b_c_do,
    getCount,
    show_back_button,
    execute_back_button,
    insert_first_batch,
    processWordsWithLemmatization,
    del_word_id_self_now,
    add_to_self_dictionary_db,
    modify_to_self_dictionary_db,
    remove_to_self_dictionary_db,
    remove_content_inner_id_from_book,
    view_number_of_tomorrow,
    all_sequence_Lemmatization_word,
    novel_sequence_Lemmatization_word,
    all_frequency_Lemmatization_word,
    novel_frequency_Lemmatization_word,
    reset_app,
    rebuildReserveFolder,
    verify_and_uncompress,
    reserve_convey_config_json,
    reserve_convey_self_dictionary_db,
    reserve_convey_self_now_db,
    reserve_convey_twenty_thousand_db,
    convey_config_json,
    convey_self_dictionary_db,
    convey_self_now_db,
    convey_twenty_thousand_db,
    four_compress,
    check_3_day,
    runFourTimeSession,
    which_now_box,
    what_two_offset_time,
    what_three_offset_time
} = require('./other.js');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false
        }
    });

    // This line removes the menu bar.
    mainWindow.removeMenu();

    mainWindow.loadFile('index.html');

    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(async () => {
    const userDataPath = app.getPath('userData');
    console.log(`[主进程] 用户数据目录 (userData path): ${userDataPath}`);
    console.log('[主进程] 步骤 1: 开始执行 copyFilesToUserDataIfNotExist...');
    const copyResult = copyFilesToUserDataIfNotExist();
    console.log(`[主进程] copyFilesToUserDataIfNotExist 函数返回: ${copyResult}`);
    if (copyResult !== 200) {
        console.error('[主进程] 错误: 关键文件复制失败，应用无法启动。');
        app.quit();
        return;
    }
    console.log('[主进程] 文件复制检查完成。');
    console.log('[主进程] 步骤 2: 开始执行 first_install...');
    const installResult = first_install();
    console.log(`[主进程] first_install 函数返回: "${installResult}"`);
    if (installResult !== "done") {
        console.error('[主进程] 错误: 应用初始化失败 (First install failed)。');
        app.quit();
        return;
    }
    console.log('[主进程] 应用初始化成功，准备创建窗口...');
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('select-file', async (event, options) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: options.filters,
    });
    if (canceled || filePaths.length === 0) return null;
    const filePath = filePaths[0];
    if (options.readAsText) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return { filePath, content };
        } catch (error) {
            console.error(`读取文件失败: ${filePath}`, error);
            return { filePath, error: error.message };
        }
    }
    return { filePath };
});

ipcMain.handle('save-config', async (event, newConfig) => {
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    try {
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
        return { success: true, config: newConfig };
    } catch (error) {
        console.error('Failed to save config:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('view-number-of-tomorrow', async () => view_number_of_tomorrow());
ipcMain.handle('all-sequence-lemmatization', async (e, text) => all_sequence_Lemmatization_word(text));
ipcMain.handle('novel-sequence-lemmatization', async (e, text) => novel_sequence_Lemmatization_word(text));
ipcMain.handle('all-frequency-lemmatization', async (e, text) => all_frequency_Lemmatization_word(text));
ipcMain.handle('novel-frequency-lemmatization', async (e, text) => novel_frequency_Lemmatization_word(text));
ipcMain.handle('reset-app', async () => reset_app());
ipcMain.handle('rebuild-reserve-folder', async () => rebuildReserveFolder());
ipcMain.handle('verify-and-uncompress', async () => verify_and_uncompress());
ipcMain.handle('reserve-convey-config-json', async () => reserve_convey_config_json());
ipcMain.handle('reserve-convey-self-dictionary-db', async () => reserve_convey_self_dictionary_db());
ipcMain.handle('reserve-convey-self-now-db', async () => reserve_convey_self_now_db());
ipcMain.handle('reserve-convey-twenty-thousand-db', async () => reserve_convey_twenty_thousand_db());
ipcMain.handle('convey-config-json', async () => convey_config_json());
ipcMain.handle('convey-self-dictionary-db', async () => convey_self_dictionary_db());
ipcMain.handle('convey-self-now-db', async () => convey_self_now_db());
ipcMain.handle('convey-twenty-thousand-db', async () => convey_twenty_thousand_db());
ipcMain.handle('four-compress', async () => four_compress());
ipcMain.handle('check-3-day', async () => check_3_day());
ipcMain.handle('run-four-time-session', async (e, h1, h2) => runFourTimeSession(h1, h2));
ipcMain.handle('which-now-box', async () => which_now_box());
ipcMain.handle('what-two-offset-time', async () => what_two_offset_time());
ipcMain.handle('what-three-offset-time', async () => what_three_offset_time());

ipcMain.handle('import-backup-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: '选择备份文件',
        properties: ['openFile'],
    });
    if (canceled || filePaths.length === 0) {
        return { success: false, message: '用户取消选择' };
    }
    const sourcePath = filePaths[0];
    const reservePath = path.join(app.getPath('userData'), 'reserve');
    const destPath = path.join(reservePath, path.basename(sourcePath));
    try {
        fs.copyFileSync(sourcePath, destPath);
        return { success: true };
    } catch (error) {
        console.error('复制备份文件失败:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('export-backup-file', async () => {
    const reservePath = path.join(app.getPath('userData'), 'reserve');
    const desktopPath = app.getPath('desktop');
    try {
        const files = fs.readdirSync(reservePath);
        const backupFile = files.find(f => !path.extname(f));
        if (!backupFile) {
            return { success: false, message: '在reserve目录中未找到备份文件' };
        }

        const sourcePath = path.join(reservePath, backupFile);
        let destPath = path.join(desktopPath, backupFile);
        let counter = 2;

        while (fs.existsSync(destPath)) {
            destPath = path.join(desktopPath, `${backupFile}(${counter})`);
            counter++;
        }
        fs.renameSync(sourcePath, destPath);
        return { success: true, path: destPath };
    } catch (error) {
        console.error('导出备份文件失败:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('which-now-id', async () => which_now_id());
ipcMain.handle('input-abc-do', async (event, action, wordId) => input_a_b_c_do(action, wordId));
ipcMain.handle('get-count', async () => getCount());
ipcMain.handle('show-back-button', async () => show_back_button());
ipcMain.handle('execute-back-button', async () => execute_back_button());

ipcMain.handle('process-words-lemmatization', async (event, inputString) => {
    try {
        return processWordsWithLemmatization(inputString);
    } catch (error) {
        console.error('调用 processWordsWithLemmatization 时出错:', error);
        return "unknown_error";
    }
});

ipcMain.handle('insert-first-batch', async (event, wordIds) => insert_first_batch(wordIds));
ipcMain.handle('del-word-id-self-now', async (event, wordId) => del_word_id_self_now(wordId));
ipcMain.handle('add-dictionary', async (event, bookName, bookContent) => add_to_self_dictionary_db(bookName, bookContent));
ipcMain.handle('modify-dictionary', async (event, bookId, bookName, bookContent) => modify_to_self_dictionary_db(bookId, bookName, bookContent));
ipcMain.handle('remove-dictionary', async (event, bookId) => remove_to_self_dictionary_db(bookId));
ipcMain.handle('remove-content-inner-id-from-book', async (event, bookId, contentInnerId) => {
    return remove_content_inner_id_from_book(bookId, contentInnerId);
});

ipcMain.handle('load-foundation', async () => {
    const userDataPath = app.getPath('userData');
    const foundationPath = path.join(userDataPath, 'foundation.json');
    try {
        const data = fs.readFileSync(foundationPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[主进程] 加载 foundation.json 失败:`, error);
        return [];
    }
});

ipcMain.handle('load-config', async () => {
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[主进程] 加载 config.json 失败:`, error);
        return {};
    }
});

ipcMain.handle('load-self-now', async () => {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'self_now.db');
    try {
        const db = new Database(dbPath, { readonly: true });
        const rows = db.prepare('SELECT word_id, long_status FROM my_table').all();
        db.close();
        return rows;
    } catch (error) {
        console.error('[主进程] 加载 self_now.db 失败:', error);
        return [];
    }
});

ipcMain.handle('load-self-dictionaries', async () => {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'self_dictionary.db');
    try {
        const db = new Database(dbPath, { readonly: true });
        const rows = db.prepare('SELECT * FROM db_table ORDER BY book_id').all();
        db.close();
        return rows;
    } catch (error) {
        console.error('[主进程] 加载 self_dictionary.db 失败:', error);
        return [];
    }
});

function robustCsvParser(csvText) {
    const rows = []; let currentRow = []; let currentField = ''; let inQuotes = false;
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < csvText.length && csvText[i + 1] === '"') { currentField += '"'; i++; }
                else { inQuotes = false; }
            } else { currentField += char; }
        } else {
            if (char === '"') { inQuotes = true; }
            else if (char === ',') { currentRow.push(currentField); currentField = ''; }
            else if (char === '\n' || char === '\r') {
                if (i === 0 || (csvText[i - 1] !== '\r' && csvText[i - 1] !== '\n')) {
                    currentRow.push(currentField); rows.push(currentRow);
                    currentRow = []; currentField = '';
                }
                if (char === '\r' && csvText[i + 1] === '\n') i++;
            } else { currentField += char; }
        }
    }
    if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
    return rows.filter(row => row.length > 0 && row.some(field => field.trim() !== ''));
}

ipcMain.handle('load-csv', async (event, filename) => {
    const userDataPath = app.getPath('userData');
    const csvPath = path.join(userDataPath, filename);
    try {
        const data = fs.readFileSync(csvPath, 'utf8');
        return robustCsvParser(data);
    } catch (error) {
        console.error(`[主进程] 加载 CSV 文件 ${filename} 失败:`, error);
        return [];
    }
});