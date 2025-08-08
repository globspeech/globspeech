const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const userData = app.getPath('userData');
const AdmZip = require('adm-zip');

const filesToCopy = [
  'compromise.js',
  'Frequency_list.txt',
  'self_dictionary.db',
  'self_now.db',
  'twenty_thousand.db',
  'config.json',
  'simplifiedchinese_foundation.csv',
  'foundation.json',
  'config_backup.json',
  'simplifiedchinese_sentence.csv',
  'sentence.csv'
];

function copyFilesToUserDataIfNotExist() {
  console.log("--- [other.js] 开始执行 copyFilesToUserDataIfNotExist ---");

  const resourcesDir = path.join(process.resourcesPath, 'app.asar.unpacked');

  console.log(`[copyFilesToUserDataIfNotExist] 源目录 (resourcesDir): ${resourcesDir}`);
  console.log(`[copyFilesToUserDataIfNotExist] 目标目录 (userData): ${userData}`);

  filesToCopy.forEach(filename => {
    const srcPath = path.join(resourcesDir, filename);
    const destPath = path.join(userData, filename);

    if (!fs.existsSync(destPath)) {
      console.log(`[copyFilesToUserDataIfNotExist] 目标文件 ${destPath} 不存在，准备复制。`);
      try {

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`[copyFilesToUserDataIfNotExist] ✅ ${filename} 已成功复制到 userData 目录。`);
        } else {

            console.error(`[copyFilesToUserDataIfNotExist] ❌ 错误: 源文件 ${srcPath} 不存在，无法复制！请确保此文件已通过 electron-builder 正确打包。`);
        }
      } catch (err) {
        console.error(`[copyFilesToUserDataIfNotExist] ❌ 复制文件 ${filename} 时出错:`, err);
      }
    } else {
      console.log(`[copyFilesToUserDataIfNotExist] ℹ️ 目标文件 ${filename} 已存在，跳过复制。`);
    }
  });

  console.log("--- [other.js] copyFilesToUserDataIfNotExist 执行完毕 ---");
  return 200;
}

function getLocalUTCTimestamp() {
    return Math.floor(Date.now() / 1000);
}

function first_install() {
    console.log("--- [other.js] 开始执行 first_install ---");
    try {
        const configPath = path.join(userData, 'config.json');
        console.log(`[first_install] 配置文件路径: ${configPath}`);

        if (!fs.existsSync(configPath)) {
            const errorMsg = "错误: config.json 在 userData 目录中未找到。可能是文件复制步骤失败。";
            console.error(`[first_install] ${errorMsg}`);
            return errorMsg;
        }
        console.log("[first_install] 成功定位 config.json 文件。");

        const configData = fs.readFileSync(configPath, 'utf8');
        let config = JSON.parse(configData);
        console.log("[first_install] 成功读取并解析 config.json。");

        if (!config.hasOwnProperty('first_install')) {
            const errorMsg = "错误: config.json 中缺少 'first_install' 键。";
            console.error(`[first_install] ${errorMsg}`);
            return errorMsg;
        }

        const firstInstallValue = config.first_install;
        console.log(`[first_install] 'first_install' 的值为: "${firstInstallValue}"`);

        if (firstInstallValue === "no") {
            console.log("[first_install] 无需执行初始化，直接返回 'done'。");
            console.log("--- [other.js] first_install 执行结束 ---");
            return "done";
        }

        if (firstInstallValue === "yes") {
            console.log("[first_install] 需要执行初始化流程...");

            const a00 = getFixedTimezoneOffset();
            const a0 = AdditionConvertSubtraction(a00);
            console.log(`[first_install] 时区计算: a00=${a00}, a0=${a0}`);

            config.two_offset_time = a00;
            config.three_offset_time = "+04:00";
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log("[first_install] 已更新并保存 config.json (时区设置)。");

            console.log("[first_install] 开始执行时间转换链...");
            const twoConvertResult = two_convert_one(a0, "+04:00");
            const convert24hResult = convert_24h(twoConvertResult);
            const convertAdditionResult = convertAdditionOffset(convert24hResult);
            const a1 = calculateOffsetSeconds(convertAdditionResult);
            console.log(`[first_install] 时间转换链结果: a1 (总偏移秒数) = ${a1}`);

            console.log(`[first_install] 正在调用 createTimeIntervals(${a1})...`);
            const createIntervalsResult = createTimeIntervals(a1);
            console.log(`[first_install] createTimeIntervals 返回: ${createIntervalsResult}`);
            if (createIntervalsResult !== "done") {
                const errorMsg = `错误: createTimeIntervals 失败，返回值为 ${createIntervalsResult}`;
                console.error(`[first_install] ${errorMsg}`);
                return errorMsg;
            }

            const utcCutResult = utc_cut();
            const a2 = utcCutResult + a1;
            console.log(`[first_install] utc_cut() 返回 ${utcCutResult}, 计算得出 a2 = ${a2}`);

            console.log(`[first_install] 正在调用 init_appbox(${a2})...`);
            const initAppboxResult = init_appbox(a2);
            console.log(`[first_install] init_appbox 返回: ${initAppboxResult}`);
            if (initAppboxResult !== "done") {
                const errorMsg = `错误: init_appbox 失败，返回值为 ${initAppboxResult}`;
                console.error(`[first_install] ${errorMsg}`);
                return errorMsg;
            }

            const currentUTCTimestamp = Math.floor(Date.now() / 1000);
            config.start_utc = String(currentUTCTimestamp);
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(`[first_install] 已更新并保存 config.json (start_utc: ${currentUTCTimestamp})。`);

            console.log("[first_install] 正在调用 first_install_extension...");
            const extensionResult = first_install_extension();
            console.log(`[first_install] first_install_extension 返回: ${extensionResult}`);
            if (extensionResult !== "done") {
                const errorMsg = `错误: first_install_extension 失败，返回值为 ${extensionResult}`;
                console.error(`[first_install] ${errorMsg}`);
                return errorMsg;
            }

            config.first_install = "no";
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log("[first_install] 已将 first_install 设置为 'no' 并最终保存 config.json。");

            console.log("--- [other.js] first_install 初始化流程成功完成 ---");
            return "done";
        }

        const errorMsg = `错误: 未预期的 first_install 值: "${firstInstallValue}"`;
        console.error(`[first_install] ${errorMsg}`);
        return errorMsg;

    } catch (error) {
        const errorMsg = `错误: first_install 执行期间捕获到致命异常: ${error.message}`;
        console.error(`[first_install] ${errorMsg}`, error.stack);
        return errorMsg;
    }
}

function first_install_extension() {
    return "done";
}

function view_number_of_tomorrow() {
    try {

        const a1 = which_now_box();

        if (a1 === 999999) {
            return 999999;
        }

        const a2 = a1 + 1;

        const dbPath = path.join(userData, 'self_now.db');
        const db = new Database(dbPath);

        const a1Count = db.prepare('SELECT COUNT(*) as count FROM my_table WHERE app_box = ?').get(a1).count;

        if (a1Count !== 0) {
            db.close();
            return 999999;
        }

        const a2Count = db.prepare('SELECT COUNT(*) as count FROM my_table WHERE app_box = ?').get(a2).count;

        db.close();

        return a2Count;

    } catch (error) {
        console.error('数据库操作错误:', error);
        return -1;
    }
}

function number_of_self_now() {
    try {

        const dbPath = path.join(userData, 'self_now.db');

        const db = new Database(dbPath);

        const count = db.prepare('SELECT COUNT(*) as count FROM my_table').get().count;

        db.close();
        return count;

    } catch (error) {
        console.error('数据库错误:', error);
        return 0;
    }
}

function rebuildReserveFolder() {
    try {

        const reserveFolderPath = path.join(userData, 'reserve');

        if (fs.existsSync(reserveFolderPath)) {

            fs.rmSync(reserveFolderPath, { recursive: true, force: true });
            console.log('已删除现有的reserve文件夹');
        }

        fs.mkdirSync(reserveFolderPath, { recursive: true });
        console.log('成功创建reserve文件夹:', reserveFolderPath);

        return 200; 

    } catch (error) {
        console.error('操作失败:', error.message);
        return 909909; 
    }
}

function reset_book_db() {
    try {

        const dbPath = path.join(userData, 'self_dictionary.db');

        if (!fs.existsSync(dbPath)) {
            return 904904;
        }

        const db = new Database(dbPath);

        const deleteStmt = db.prepare('DELETE FROM db_table WHERE book_timestamp > 999');
        deleteStmt.run();

        db.close();

        return 200;

    } catch (error) {
        console.error('重置书籍数据库时发生错误:', error);
        return 904904;
    }
}

function clean_self_now() {
    try {

        const dbPath = path.join(userData, 'self_now.db');

        const db = new Database(dbPath);

        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = OFF');

        const start = Date.now();

        db.transaction(() => {

            db.prepare('DELETE FROM my_table').run();
        })();

        const elapsed = (Date.now() - start) / 1000;
        console.log(`clean_self_now 耗时：${elapsed.toFixed(3)} 秒`);

        db.close();
        return "done";
    } catch (error) {
        console.error('clean_self_now 错误：', error);
        return "error";
    }
}

function clean_twenty_thousand() {
    try {

        const dbPath = path.join(userData, 'twenty_thousand.db');

        const db = new Database(dbPath);

        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = OFF');

        const start = Date.now();

        db.transaction(() => {

            db.prepare('DELETE FROM time_intervals').run();
        })();

        const elapsed = (Date.now() - start) / 1000;
        console.log(`clean_twenty_thousand 耗时：${elapsed.toFixed(3)} 秒`);

        db.close();
        return "done";
    } catch (error) {
        console.error('clean_twenty_thousand 错误：', error);
        return "error";
    }
}

function bundle_config_2_1() {
    try {

        const configPath = path.join(userData, 'config.json');

        const configBackupPath = path.join(userData, 'config_backup.json');

        if (!fs.existsSync(configBackupPath)) {
            console.error('❌ 在应用包中未找到 config_backup.json');
            return 904904;
        }

        const configData = fs.readFileSync(configPath, 'utf8');
        const backupData = fs.readFileSync(configBackupPath, 'utf8');

        const configJSON = JSON.parse(configData);
        const backupJSON = JSON.parse(backupData);

        const mergedJSON = mergeDictionaries(configJSON, backupJSON);

        fs.writeFileSync(configPath, JSON.stringify(mergedJSON, null, 2));
        console.log('✅ config.json 更新成功');
        return 200;

    } catch (error) {
        console.error(`❌ 配置更新失败
原因: ${error.message}
路径: ${error.path || ''}`);
        return 904904;
    }
}

function mergeDictionaries(source, updates) {
    const result = { ...source };
    for (const [key, value] of Object.entries(updates)) {

        if (typeof result[key] === 'object' && !Array.isArray(result[key]) &&
            typeof value === 'object' && !Array.isArray(value)) {
            result[key] = mergeDictionaries(result[key], value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

function reset_timezone() {
    try {

        const configPath = path.join(userData, 'config.json');

        let config = {};
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configData);
        }

        const a00 = getFixedTimezoneOffset();
        const a0 = AdditionConvertSubtraction(a00);

        config.two_offset_time = a00;
        config.three_offset_time = "+04:00";

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        const twoConvertResult = two_convert_one(a0, "+04:00");
        const convert24hResult = convert_24h(twoConvertResult);
        const convertAdditionResult = convertAdditionOffset(convert24hResult);
        const a1 = calculateOffsetSeconds(convertAdditionResult);

        const createIntervalsResult = createTimeIntervals(a1);
        if (createIntervalsResult !== "done") {
            return "error: createTimeIntervals failed";
        }

        const a2 = utc_cut() + a1;

        const initAppboxResult = init_appbox(a2);
        if (initAppboxResult !== "done") {
            return "error: init_appbox failed";
        }

        const currentUTCTimestamp = Math.floor(Date.now() / 1000);
        config.start_utc = String(currentUTCTimestamp);

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        return "done";

    } catch (error) {
        return `error: ${error.message}`;
    }
}

function reset_app() {
    try {

        bundle_config_2_1();

        const timezoneResult = reset_timezone();
        if (timezoneResult !== "done") {
            return 904904;
        }

        const bookDbResult = reset_book_db();
        if (bookDbResult !== 200) {
            return 904904;
        }

        const cleanResult = clean_self_now();
        if (cleanResult !== "done") {
            return 904904;
        }

        return 200;

    } catch (error) {

        return 904904;
    }
}

function insert_first_batch(word_ids_string) {
    try {

        const currentBox = which_now_box();
        if (currentBox === 999999) {
            return "zero_row_now";
        }

        const word_ids = parseWordIds(word_ids_string);

        if (word_ids.length === 0) {
            return "done"; 
        }

        const dbPath = path.join(userData, 'self_now.db');

        const db = new Database(dbPath);

        const currentUTCTimestamp = getLocalUTCTimestamp();

        const insertMany = db.transaction((wordIds) => {

            const maxOrderIdRow = db.prepare('SELECT MAX(order_id) as max_order_id FROM my_table').get();
            let nextOrderId = 1; 

            if (maxOrderIdRow && maxOrderIdRow.max_order_id !== null) {
                nextOrderId = maxOrderIdRow.max_order_id + 1;
            }

            const insertStmt = db.prepare(`
                INSERT INTO my_table (order_id, word_id, add_utc_date, app_box, long_status, short_status, long_a, short_a, backup_long_status, backup_short_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (let index = 0; index < wordIds.length; index++) {
                insertStmt.run(
                    nextOrderId + index,     
                    wordIds[index],          
                    currentUTCTimestamp,     
                    currentBox,              
                    "A",                     
                    "A",                     
                    9,                       
                    0,                       
                    "W",                     
                    "W"                      
                );
            }
        });

        insertMany(word_ids);

        db.close();
        return "done";
    } catch (error) {
        console.error("Database error:", error);
        return `Error: ${error.message}`;
    }
}

function parseWordIds(input) {
    return input.split('|')
        .map(component => {
            const trimmed = component.trim();
            return trimmed === '' ? null : parseInt(trimmed);
        })
        .filter(id => id !== null && !isNaN(id));
}

function parseWordIds(input) {
    return input.split('|')
        .map(component => {
            const trimmed = component.trim();
            return trimmed === '' ? null : parseInt(trimmed);
        })
        .filter(id => id !== null && !isNaN(id));
}

function today_once_box() {
    try {

        const a1 = which_now_box_2();

        if (a1 === 999999) {
            return 200;
        }

        const configFileURL = path.join(userData, 'config.json');

        const jsonData = fs.readFileSync(configFileURL, 'utf8');
        const jsonObject = JSON.parse(jsonData);

        const todayOnceBoxValue = jsonObject.today_once_box;
        const configNumber = parseInt(todayOnceBoxValue);

        if (isNaN(configNumber)) {
            console.error('无法读取或转换today_once_box的值');
            return 904904;
        }

        if (configNumber === a1) {
            return 200;
        }

        const setResult = set_ok_once();
        if (setResult !== 200) {
            console.error(`set_ok_once()未返回200，返回值为: ${setResult}`);
            return 904904;
        }

        jsonObject.today_once_box = String(a1);

        fs.writeFileSync(configFileURL, JSON.stringify(jsonObject, null, 2));

        return 200;

    } catch (error) {
        console.error(`发生错误: ${error.message}`);
        return 904904;
    }
}

function set_ok_once() {
    try {
        const dbPath = path.join(userData, 'self_now.db');
        const db = new Database(dbPath);

        const rowsWithShortA1 = db.prepare('SELECT * FROM my_table WHERE short_a = 1').all();

        const updateTransaction = db.transaction(() => {
            for (const row of rowsWithShortA1) {
                const backupData = row.backup_long_status;
                const components = backupData.split('|');

                if (components.length >= 4) {
                    const newAppBox = parseInt(components[0]) || 0;
                    const newLongStatus = components[1];
                    const newShortStatus = components[2];
                    const newLongA = parseInt(components[3]) || 0;

                    db.prepare(`
                        UPDATE my_table 
                        SET app_box = ?, long_status = ?, short_status = ?, 
                            long_a = ?, backup_long_status = 'W', short_a = 0
                        WHERE order_id = ?
                    `).run(newAppBox, newLongStatus, newShortStatus, newLongA, row.order_id);
                }
            }
        });

        updateTransaction();

        const o1 = which_now_box_2();
        const rowsNotA = db.prepare('SELECT * FROM my_table WHERE short_status != ?').all('A');

        const updateNotATransaction = db.transaction(() => {
            for (const row of rowsNotA) {
                const currentAppBox = row.app_box;

                if (currentAppBox > o1) {
                    console.error(`Error: app_box (${currentAppBox}) is greater than o1 (${o1})`);
                    db.close();
                    return 904904;
                } else if (currentAppBox < o1) {
                    db.prepare('UPDATE my_table SET short_status = ? WHERE order_id = ?')
                        .run('A', row.order_id);
                }

            }
        });

        updateNotATransaction();

        const todayResult = is_today_greater_than_past();
        if (todayResult !== "done") {
            console.error("Error: is_today_greater_than_past() did not return 'done'");
            db.close();
            return 904904;
        }

        const pastResult = make_past_appbox_today();
        if (pastResult !== 200) {
            console.error("Error: make_past_appbox_today() did not return 200");
            db.close();
            return 904904;
        }

        db.close();
        return 200;

    } catch (error) {
        console.error("Database error:", error);
        return 904904;
    }
}

function which_now_id() {

    const a1 = which_now_box();

    try {

        const dbPath = path.join(userData, 'self_now.db');
        const db = new Database(dbPath);

        const results = db.prepare(`
            SELECT word_id 
            FROM my_table 
            WHERE app_box = ? AND short_a = 0 
            ORDER BY order_id DESC
        `).all(a1);

        db.close();

        if (results.length === 0) {
            return 999999;
        } else {

            return results[0].word_id;
        }

    } catch (error) {
        console.error("Database error:", error);
        return 999999;
    }
}

function add_to_versatile(param1, param2, param3, param4, param5) {
    try {

        const checkResult = only_one_in_selfdb();

        if (checkResult === 200) {

            const directResult = add_to_directly(param1, param2, param3, param4, param5);
            if (directResult === 200) {
                return 200;
            } else {
                return 904904;
            }
        } else if (checkResult === 404) {

            const backupResult = add_to_backup(param1, param2, param3, param4, param5);
            if (backupResult === 200) {
                return 200;
            } else {
                return 904904;
            }
        } else {

            return 904904;
        }
    } catch (error) {

        return 904904;
    }
}

function add_to_directly(wordId, appBox, longStatus, shortStatus, longA) {
    try {

        const dbPath = path.join(userData, 'self_now.db');

        const db = new Database(dbPath);

        const updateStmt = db.prepare(`
            UPDATE my_table 
            SET app_box = ?, long_status = ?, short_status = ?, long_a = ?
            WHERE word_id = ?
        `);

        const result = updateStmt.run(appBox, longStatus, shortStatus, longA, wordId);

        if (result.changes > 0) {
            db.close();

            const applyResult = apply_long_short_status(wordId);

            if (applyResult === 200) {
                return 200;
            } else {
                throw new Error(`apply_long_short_status failed with result: ${applyResult}`);
            }
        } else {
            db.close();
            throw new Error(`No row found with word_id: ${wordId}`);
        }

    } catch (error) {

        throw new Error(`Database update failed: ${error.message}`);
    }
}

function add_to_backup(param1, param2, param3, param4, param5) {
    try {

        const dbPath = path.join(userData, 'self_now.db');

        const db = new Database(dbPath);

        const backupString = `${param2}|${param3}|${param4}|${param5}|`;

        const updateStmt = db.prepare(`
            UPDATE my_table 
            SET short_a = 1, backup_long_status = ?
            WHERE word_id = ?
        `);

        const result = updateStmt.run(backupString, param1);

        db.close();

        if (result.changes > 0) {
            return 200;
        } else {
            throw new Error(`No row found with word_id: ${param1}`);
        }

    } catch (error) {

        throw new Error(`数据库操作失败: ${error.message}`);
    }
}

function only_one_in_selfdb() {
    const a1 = which_now_box();

    try {

        const dbPath = path.join(userData, 'self_now.db');

        const db = new Database(dbPath);

        const count = db.prepare('SELECT COUNT(*) as count FROM my_table WHERE app_box = ?').get(a1).count;

        db.close();

        if (count === 0) {
            return 404;
        } else if (count === 1) {
            return 200;
        } else {
            return 404;
        }

    } catch (error) {

        return 404404404;
    }
}

function backup_execute() {
    try {

        const dbPath = path.join(userData, 'self_now.db');

        const db = new Database(dbPath);

        const rows = db.prepare('SELECT * FROM my_table WHERE short_a = 1').all();

        if (rows.length === 0) {
            db.close();
            return 200;
        }

        if (rows.length >= 2) {
            db.close();
            return 904904;
        }

        const row = rows[0];
        const currentOrderId = row.order_id;
        const currentWordId = row.word_id; 
        const backupContent = row.backup_long_status;

        const components = backupContent.split('|');

        if (components.length !== 5 || components[4] !== '') {
            db.close();
            return 904904;
        }

        const firstNumber = parseInt(components[0]);
        const fourthNumber = parseInt(components[3]);

        if (isNaN(firstNumber) || isNaN(fourthNumber)) {
            db.close();
            return 904904;
        }

        const secondLetter = components[1];
        const thirdLetter = components[2];

        const updateStmt = db.prepare(`
            UPDATE my_table 
            SET short_a = 0, app_box = ?, long_status = ?, 
                short_status = ?, long_a = ?, backup_long_status = 'W'
            WHERE order_id = ?
        `);

        updateStmt.run(firstNumber, secondLetter, thirdLetter, fourthNumber, currentOrderId);

        db.close();

        const applyResult = apply_long_short_status(currentWordId);

        if (applyResult === 200) {
            return 200;
        } else {
            return 904904;
        }

    } catch (error) {
        return 904904;
    }
}

function getNextLetter(letter) {

    if (letter.length !== 1 || !/[A-Y]/i.test(letter)) {
        return "Invalid input. Please enter a single letter from A to Y.";
    }

    const upperLetter = letter.toUpperCase();

    const asciiValue = upperLetter.charCodeAt(0);

    const nextCharAscii = asciiValue + 1;

    const nextChar = String.fromCharCode(nextCharAscii);

    return nextChar;
}

function get_9_Letter(input) {
    switch (input) {
        case "A":
            return "H";
        case "H":
            return "L";
        default:
            return "error";
    }
}

function alphabet_day_reference(letter) {
    switch (letter) {
        case "A":
            return 1;
        case "B":
            return 1;
        case "C":
            return 1;
        case "D":
            return 2;
        case "E":
            return 2;
        case "F":
            return Math.floor(Math.random() * 2) + 4; 
        case "G":
            return Math.floor(Math.random() * 4) + 7; 
        case "H":
            return Math.floor(Math.random() * 11) + 15; 
        case "I":
            return Math.floor(Math.random() * 21) + 40; 
        case "J":
            return Math.floor(Math.random() * 41) + 80; 
        case "K":
            return Math.floor(Math.random() * 61) + 200; 
        case "L":
            return 10000;
        default:
            return 904904;
    }
}

function internal_first_round(h1, h2) {
    try {

        const dbPath = path.join(userData, 'self_now.db');
        const db = new Database(dbPath);

        const row = db.prepare('SELECT * FROM my_table WHERE word_id = ?').get(h1);

        if (!row) {
            db.close();
            return "error";
        }

        if (h2 === "A") {
            const longAValue = row.long_a;

            if (longAValue === 9) {
                const a1 = row.long_status;
                const a9 = row.app_box;
                const a2 = get_9_Letter(a1);
                const a3 = alphabet_day_reference(a2);
                const a10 = a9 + a3;

                db.close();
                const result = add_to_versatile(h1, a10, a2, "A", 9);
                if (result === 200) {
                    return "done";
                } else {
                    return "error";
                }
            } else if (longAValue === 5) {
                const b1 = row.long_status;
                const b9 = row.app_box;
                const b2 = getNextLetter(b1);
                const b3 = alphabet_day_reference(b2);
                const b10 = b9 + b3;

                db.close();
                const result = add_to_versatile(h1, b10, b2, "A", 5);
                if (result === 200) {
                    return "done";
                } else {
                    return "error";
                }
            } else {
                db.close();
                return "continue";
            }
        } else if (h2 === "B") {
            const longAValue = row.long_a;

            if (longAValue === 9 || longAValue === 5) {
                const c1 = row.long_status;
                const c3 = row.app_box;

                db.close();
                const result = add_to_versatile(h1, c3, c1, "B", 7);
                if (result === 200) {
                    return "done";
                } else {
                    return "error";
                }
            } else {
                db.close();
                return "continue";
            }
        } else if (h2 === "C") {
            const longAValue = row.long_a;

            if (longAValue === 9 || longAValue === 5) {
                const f1 = row.long_status;
                const f3 = row.app_box;

                db.close();
                const result = add_to_versatile(h1, f3, f1, "A", 8);
                if (result === 200) {
                    return "done";
                } else {
                    return "error";
                }
            } else {
                db.close();
                return "continue";
            }
        } else {
            db.close();
            return "error";
        }
    } catch (error) {
        return "error";
    }
}

function internal_second_round(h1, h2) {
    try {

        const dbPath = path.join(userData, 'self_now.db');

        const db = new Database(dbPath);

        const row = db.prepare('SELECT * FROM my_table WHERE word_id = ?').get(h1);

        if (!row) {
            db.close();
            return "error";
        }

        if (h2 === "A") {
            const b1 = row.short_status;

            if (b1 === "E") {
                const b9 = row.app_box;
                const b2 = row.long_status;
                const b3 = getNextLetter(b2);
                const b4 = alphabet_day_reference(b3);
                const b10 = b4 + b9;

                db.close();
                const result = add_to_versatile(h1, b10, b3, "A", 5);
                if (result === 200) {
                    return "done";
                }
            } else {
                const c1 = getNextLetter(b1);
                const c9 = row.app_box;
                const c2 = row.long_status;
                const c3 = row.long_a;

                db.close();
                const result = add_to_versatile(h1, c9, c2, c1, c3);
                if (result === 200) {
                    return "done";
                }
            }
        } else if (h2 === "B") {
            const f1 = row.app_box;
            const f2 = row.long_status;
            const f4 = row.long_a;

            db.close();
            const result = add_to_versatile(h1, f1, f2, "B", f4);
            if (result === 200) {
                return "done";
            }
        } else if (h2 === "C") {
            const s1 = row.app_box;
            const s2 = row.long_status;
            const s4 = row.long_a;

            db.close();
            const result = add_to_versatile(h1, s1, s2, "A", 8);
            if (result === 200) {
                return "done";
            }
        }

        db.close();
        return "error";

    } catch (error) {
        return "error";
    }
}

function input_a_b_c_do(q1, q2) {
    try {

        const backupResult = backup_execute();
        if (backupResult !== 200) {
            return "error";
        }

        const firstRoundResult = internal_first_round(q2, q1);

        if (firstRoundResult === "done") {
            return "done";
        }

        if (firstRoundResult === "continue") {
            const secondRoundResult = internal_second_round(q2, q1);

            if (secondRoundResult === "done") {
                return "done";
            } else {
                return "error";
            }
        }

        return "error";

    } catch (error) {

        return "error";
    }
}

function execute_back_button() {
    const a1 = which_now_box();

    const dbPath = path.join(userData, 'self_now.db');

    try {
        const db = new Database(dbPath);

        const rows = db.prepare('SELECT * FROM my_table WHERE app_box = ? AND short_a = 1').all(a1);

        if (rows.length === 0) {
            db.close();
            return 904904;
        } else if (rows.length === 1) {
            const row = rows[0];
            const targetWordId = row.word_id;

            db.prepare(`
                UPDATE my_table 
                SET short_a = 0, backup_long_status = 'W'
                WHERE app_box = ? AND short_a = 1
            `).run(a1);

            db.close();
            return targetWordId;
        } else {

            db.close();
            throw new Error('找到多个符合条件的行，操作终止');
        }

    } catch (error) {
        throw new Error(`数据库操作错误: ${error.message}`);
    }
}

function show_back_button() {
    // 获取当前的 app_box 标识符
    const a1 = which_now_box();
    const dbPath = path.join(userData, 'self_now.db');
    
    // 建立数据库连接。建议在函数开始时打开，在结束时关闭。
    const db = new Database(dbPath);

    try {
        // 步骤 1: 查找 app_box 中 short_a = 1 的行
        const rows = db.prepare('SELECT * FROM my_table WHERE app_box = ? AND short_a = 1').all(a1);

        // 如果找到多个符合条件的行，这是一个异常情况，直接抛出错误
        if (rows.length > 1) {
            throw new Error('找到多个符合条件的行，操作终止');
        }

        // 如果没有找到行，返回 404
        if (rows.length === 0) {
            return 404;
        }

        // 步骤 2: 当且仅当找到一个符合条件的行时，执行以下逻辑
        // 此时 rows.length === 1
        const s1 = rows[0]; // 将这个唯一的行命名为 s1

        // 步骤 3: 在同一个 app_box 中查找最大的 order_id
        // 使用聚合函数 MAX() 直接获取最大值，效率更高
        const maxOrderRow = db.prepare('SELECT MAX(order_id) as max_id FROM my_table WHERE app_box = ?').get(a1);

        // 步骤 4: 比较 s1 行的 order_id 是否是最大的 order_id
        if (s1.order_id === maxOrderRow.max_id) {
            // 如果是最大的，返回 200
            return 200;
        } else {
            // 如果不是最大的，返回 404
            return 404;
        }

    } catch (error) {
        // 捕获并重新抛出格式化的数据库操作错误
        throw new Error(`数据库操作错误: ${error.message}`);
    } finally {
        // 步骤 5: 无论成功还是失败，最后都要确保关闭数据库连接
        if (db && db.open) {
            db.close();
        }
    }
}



function del_word_id_self_now(word_id) {

    const dbPath = path.join(userData, 'self_now.db');

    const backupResult = backup_execute();
        if (backupResult !== 200) {
            return "error";
        }

    try {
        const db = new Database(dbPath);

        db.prepare('DELETE FROM my_table WHERE word_id = ?').run(word_id);

        db.close();

        const result = fixorderIdsequence_selfdb();

        if (result === 200) {
            return 200;
        } else {
            return 904904;
        }

    } catch (error) {

        return 904904;
    }
}

function getCount() {
    try {
        const w1 = which_now_box();

        const dbPath = path.join(userData, 'self_now.db');
        const db = new Database(dbPath);

        const w2 = db.prepare('SELECT COUNT(*) as count FROM my_table WHERE app_box = ? AND short_a = 0')
            .get(w1).count;

        const shortA1Rows = db.prepare('SELECT * FROM my_table WHERE short_a = 1').all();

        if (shortA1Rows.length >= 2) {
            db.close();
            return 904904; 
        }

        if (shortA1Rows.length === 0) {
            db.close();
            return w2;
        }

        const row = shortA1Rows[0];
        const backupStatus = row.backup_long_status;

        const firstPart = backupStatus.split('|')[0];
        const firstNumber = parseInt(firstPart);

        db.close();

        if (!isNaN(firstNumber)) {
            if (firstNumber === w1) {
                return w2 + 1;
            } else {
                return w2;
            }
        }

        return w2;

    } catch (error) {
        return 904904;
    }
}

function which_now_box() {
    today_once_box();

    console.log('[Entry] Function started');
    const currentTimestamp = getLocalUTCTimestamp();
    console.log(`[Timestamp] currentTimestamp = ${currentTimestamp}`);
    const sum = currentTimestamp;
    console.log(`[Sum] Using timestamp directly as sum = ${sum}`);

    const dbPath = path.join(userData, 'twenty_thousand.db');
    console.log(`[DB Path] Database location: ${dbPath}`);

    try {
        console.log('[DB] Attempting database connection');
        const db = new Database(dbPath);
        console.log('[DB] Connection successful');

        console.log(`[Query] Preparing SQL: SELECT app_box FROM time_intervals WHERE timestamp_start <= ? AND timestamp_end >= ?`);
        console.log(`[Params] Using params: ${sum}, ${sum}`);

        const rows = db.prepare(`
            SELECT app_box 
            FROM time_intervals 
            WHERE timestamp_start <= ? AND timestamp_end >= ?
        `).all(sum, sum);

        console.log(`[Query Result] Found ${rows.length} matching rows`);
        if (rows.length > 0) {
            console.log(`[Data] First row content:`, rows[0]);
        }

        console.log('[DB] Closing database connection');
        db.close();
        console.log('[DB] Connection closed');

        switch (rows.length) {
            case 0:
                console.log("[Case] No matching intervals found (returning 999999)");
                return 999999;
            case 1:
                console.log(`[Case] Single match found (returning app_box=${rows[0].app_box})`);
                return rows[0].app_box;
            default:
                console.log(`[Case] WARNING: ${rows.length} overlapping intervals found! (returning 909909)`);
                return 909909;
        }
    } catch (error) {
        console.error(`[Error] Database operation failed:`, error);
        console.log("[Case] Exception caught (returning 999999)");
        return 999999;
    }
}

function which_now_box_2() {

    console.log('[Entry] Function started');
    const currentTimestamp = getLocalUTCTimestamp();
    console.log(`[Timestamp] currentTimestamp = ${currentTimestamp}`);
    const sum = currentTimestamp;
    console.log(`[Sum] Using timestamp directly as sum = ${sum}`);

    const dbPath = path.join(userData, 'twenty_thousand.db');
    console.log(`[DB Path] Database location: ${dbPath}`);

    try {
        console.log('[DB] Attempting database connection');
        const db = new Database(dbPath);
        console.log('[DB] Connection successful');

        console.log(`[Query] Preparing SQL: SELECT app_box FROM time_intervals WHERE timestamp_start <= ? AND timestamp_end >= ?`);
        console.log(`[Params] Using params: ${sum}, ${sum}`);

        const rows = db.prepare(`
            SELECT app_box 
            FROM time_intervals 
            WHERE timestamp_start <= ? AND timestamp_end >= ?
        `).all(sum, sum);

        console.log(`[Query Result] Found ${rows.length} matching rows`);
        if (rows.length > 0) {
            console.log(`[Data] First row content:`, rows[0]);
        }

        console.log('[DB] Closing database connection');
        db.close();
        console.log('[DB] Connection closed');

        switch (rows.length) {
            case 0:
                console.log("[Case] No matching intervals found (returning 999999)");
                return 999999;
            case 1:
                console.log(`[Case] Single match found (returning app_box=${rows[0].app_box})`);
                return rows[0].app_box;
            default:
                console.log(`[Case] WARNING: ${rows.length} overlapping intervals found! (returning 909909)`);
                return 909909;
        }
    } catch (error) {
        console.error(`[Error] Database operation failed:`, error);
        console.log("[Case] Exception caught (returning 999999)");
        return 999999;
    }
}

function make_past_appbox_today() {
    try {

        const a1 = which_now_box_2();

        const dbPath = path.join(userData, 'self_now.db');

        const db = new Database(dbPath);

        db.prepare('UPDATE my_table SET app_box = ? WHERE app_box < ?').run(a1, a1);

        db.close();

        return 200;

    } catch (error) {

        console.error("Database error:", error);
        return 904904;
    }
}

function is_today_greater_than_past() {
    const a1 = which_now_box_2();
    const dbPath = path.join(userData, 'self_now.db');

    try {
        const db = new Database(dbPath);

        const b1Rows = db.prepare('SELECT * FROM my_table WHERE app_box = ? ORDER BY order_id ASC').all(a1);
        const b2Rows = db.prepare('SELECT * FROM my_table WHERE app_box < ? ORDER BY order_id ASC').all(a1);

        if (b1Rows.length === 0 || b2Rows.length === 0) {
            db.close();
            return "done";
        }

        const totalCount = b1Rows.length + b2Rows.length;
        const updateOperations = []; 

        let currentOrder = totalCount - b1Rows.length + 1;
        for (const row of b1Rows) {
            updateOperations.push({ word_id: row.word_id, new_order_id: currentOrder });
            currentOrder++;
        }

        currentOrder = 1;
        for (const row of b2Rows) {
            updateOperations.push({ word_id: row.word_id, new_order_id: currentOrder });
            currentOrder++;
        }

        const updateStmt = db.prepare('UPDATE my_table SET order_id = ? WHERE word_id = ?');
        const updateMany = db.transaction((operations) => {
            for (const operation of operations) {
                updateStmt.run(operation.new_order_id, operation.word_id);
            }
        });

        updateMany(updateOperations);

        db.close();

    } catch (error) {
        console.error("Database error:", error);
    }
    return "done";
}

function apply_long_short_status(u1) {
    try {
        const dbPath = path.join(userData, 'self_now.db');
        const db = new Database(dbPath);

        const d1Row = db.prepare('SELECT * FROM my_table WHERE word_id = ?').get(u1);
        if (!d1Row) {
            db.close();
            return 904904;
        }

        const d1OrderId = d1Row.order_id;
        const d1ShortStatus = d1Row.short_status;
        const d1AppBox = d1Row.app_box;

        const w1 = which_now_box();          
        if (w1 !== d1AppBox) {               
            db.close();
            return 200;
        }

        let targetCount;
        switch (d1ShortStatus) {
            case "A": targetCount = 2; break;
            case "B": targetCount = 6; break;
            case "C": targetCount = 13; break;
            case "D": targetCount = 24; break;
            case "E": targetCount = 99; break;
            default:
                db.close();
                return 904904;
        }

        const targetRows = db.prepare(`
            SELECT word_id, order_id 
            FROM my_table 
            WHERE app_box = ? AND word_id != ? 
            ORDER BY order_id DESC 
            LIMIT ?
        `).all(w1, u1, targetCount);

        if (targetRows.length === 0) {
            db.close();
            return 200;
        }

        let allOrderIds = targetRows.map(row => row.order_id);
        allOrderIds.push(d1OrderId);
        allOrderIds.sort((a, b) => a - b); 

        const updateTransaction = db.transaction(() => {

            db.prepare('UPDATE my_table SET order_id = -1 WHERE word_id = ?').run(u1);
            targetRows.forEach((row, index) => {
                db.prepare('UPDATE my_table SET order_id = ? WHERE word_id = ?')
                    .run(-(index + 2), row.word_id);
            });

            db.prepare('UPDATE my_table SET order_id = ? WHERE word_id = ?')
                .run(allOrderIds[0], u1);

            targetRows.forEach((row, index) => {
                const newOrderId = allOrderIds[allOrderIds.length - 1 - index];
                db.prepare('UPDATE my_table SET order_id = ? WHERE word_id = ?')
                    .run(newOrderId, row.word_id);
            });
        });

        updateTransaction();

        db.close();
        return 200;

    } catch (error) {
        return 904904;
    }
}

function fixorderIdsequence_selfdb() {
    try {

        const dbPath = path.join(userData, 'self_now.db');

        const db = new Database(dbPath);

        const allRows = db.prepare('SELECT * FROM my_table ORDER BY order_id').all();

        if (allRows.length === 0) {
            db.close();
            return 200;
        }

        if (allRows.length === 1) {
            const firstRow = allRows[0];
            const currentOrderId = firstRow.order_id;

            if (currentOrderId !== 1) {

                db.prepare('UPDATE my_table SET order_id = 1 WHERE order_id = ?').run(currentOrderId);
            }
            db.close();
            return 200;
        }

        const updateData = [];

        for (let index = 0; index < allRows.length; index++) {
            const currentOrderId = allRows[index].order_id;
            const newOrderId = index + 1;

            if (currentOrderId !== newOrderId) {
                updateData.push({ oldOrderId: currentOrderId, newOrderId: newOrderId });
            }
        }

        if (updateData.length > 0) {

            const updateTransaction = db.transaction(() => {
                for (const updateInfo of updateData) {
                    db.prepare('UPDATE my_table SET order_id = ? WHERE order_id = ?')
                        .run(updateInfo.newOrderId, updateInfo.oldOrderId);
                }
            });

            updateTransaction();
        }

        db.close();
        return 200;

    } catch (error) {
        console.error('数据库操作错误:', error);
        return 404;
    }
}

function check_today_finish() {
    const a1 = which_now_box();

    try {
        const dbPath = path.join(userData, 'self_now.db');
        const db = new Database(dbPath);

        const count = db.prepare('SELECT COUNT(*) as count FROM my_table WHERE app_box = ?').get(a1).count;

        db.close();

        return count === 0 ? 200 : 404;

    } catch (error) {
        console.error("Database error:", error);
        return 904;
    }
}

function utc_cut() {

    const currentTimestamp = Date.now() / 1000;

    const secondsInDay = 86400;

    const dayStartTimestamp = Math.floor(currentTimestamp / secondsInDay) * secondsInDay;

    return dayStartTimestamp;
}

function calculateOffsetSeconds(offsetString) {

    offsetString = offsetString.trim();

    if (!offsetString.startsWith('+') || offsetString.length !== 6 || !offsetString.includes(':')) {
        console.log('偏移格式无效:', offsetString);
        return 0;
    }

    const colonIndex = offsetString.indexOf(':');
    const hours = parseInt(offsetString.substring(1, colonIndex));
    const minutes = parseInt(offsetString.substring(colonIndex + 1));

    if (isNaN(hours) || isNaN(minutes)) {
        console.log('无法解析小时或分钟:', offsetString);
        return 0;
    }

    return hours * 3600 + minutes * 60;
}

function getFixedTimezoneOffset() {
    const now = new Date();
    const offset = now.getTimezoneOffset(); 

    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? "+" : "-";

    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function AdditionConvertSubtraction(input) {

    if (input === "+00:00" || input === "-00:00") {
        return input;
    }

    if (input.startsWith("+")) {
        return "-" + input.substring(1);
    } else if (input.startsWith("-")) {
        return "+" + input.substring(1);
    }

    return input;
}

function convert_24h(offset) {

    const sign = offset.startsWith("+") ? "+" : "-";

    const timeString = offset.substring(1);

    const components = timeString.split(':');
    if (components.length !== 2) {
        return offset;
    }

    const hours = parseInt(components[0]);
    const minutes = parseInt(components[1]);

    if (isNaN(hours) || isNaN(minutes)) {
        return offset;
    }

    const totalMinutes = hours * 60 + minutes;

    const remainderMinutes = totalMinutes % 1440;

    const finalHours = Math.floor(remainderMinutes / 60);
    const finalMinutes = remainderMinutes % 60;

    return `${sign}${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
}

function two_convert_one(offset1, offset2) {

    function parseOffset(offset) {
        const sign = offset.startsWith("-") ? -1 : 1;
        const timeString = offset.substring(1); 
        const components = timeString.split(':');

        if (components.length !== 2) {
            return 0;
        }

        const hours = parseInt(components[0]);
        const minutes = parseInt(components[1]);

        if (isNaN(hours) || isNaN(minutes)) {
            return 0;
        }

        return sign * (hours * 60 + minutes);
    }

    function formatOffset(totalMinutes) {
        const sign = totalMinutes >= 0 ? "+" : "-";
        const absoluteMinutes = Math.abs(totalMinutes);
        const hours = Math.floor(absoluteMinutes / 60);
        const minutes = absoluteMinutes % 60;

        return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    const minutes1 = parseOffset(offset1);
    const minutes2 = parseOffset(offset2);

    const totalMinutes = minutes1 + minutes2;

    return formatOffset(totalMinutes);
}

function convertAdditionOffset(input) {

    const trimmedInput = input.trim();

    const pattern = /^[+-]\d{2}:\d{2}$/;

    if (!pattern.test(trimmedInput)) {
        return "输入格式错误，请使用 +/-HH:MM 格式";
    }

    const sign = trimmedInput[0];
    const timeString = trimmedInput.substring(1);
    const components = timeString.split(':');

    const hours = parseInt(components[0]);
    const minutes = parseInt(components[1]);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return "时间格式错误";
    }

    if (sign === '+') {
        return `+${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    if (hours === 0 && minutes === 0) {
        return "+00:00";
    }

    const totalMinutes = hours * 60 + minutes;

    const positiveOffsetMinutes = 1440 - totalMinutes;

    const newHours = Math.floor(positiveOffsetMinutes / 60);
    const newMinutes = positiveOffsetMinutes % 60;

    return `+${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

function createTimeIntervals(h1) {
    const dbPath = path.join(userData, 'twenty_thousand.db');

    try {
        const db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = OFF');

        db.prepare('DELETE FROM time_intervals').run();

        const insertStmt = db.prepare(`
            INSERT INTO time_intervals(
                sequence_id, timestamp_start,
                timestamp_end, app_box
            ) VALUES (?,?,?,?)
        `);

        const baseStart = 1735689600;
        const baseEnd = 1735775999;
        const oneDay = 86400;
        const startTime = Date.now();

        const insertMany = db.transaction(() => {
            for (let i = 1; i <= 56500; i++) {
                const offset = (i - 1) * oneDay;
                const tsStart = baseStart + h1 + offset;
                const tsEnd = baseEnd + h1 + offset;
                insertStmt.run(i, tsStart, tsEnd, 0);
            }
        });

        insertMany();

        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`插入 56,500 行耗时: ${elapsed.toFixed(3)} 秒`);

        db.close();
        return "done";
    } catch (error) {
        return `error: ${error.message}`;
    }
}

function init_appbox(u1) {
    const dbPath = path.join(userData, 'twenty_thousand.db');

    try {
        const db = new Database(dbPath);

        const row = db.prepare('SELECT sequence_id FROM time_intervals WHERE timestamp_start = ?').get(u1);

        if (!row) {
            db.close();
            return `error: 未找到 timestamp_start=${u1} 的行`;
        }

        const targetSeq = row.sequence_id;

        const startSeq = Math.max(1, targetSeq - 5);

        const updateStmt = db.prepare(`
            UPDATE time_intervals
            SET app_box = CASE
                WHEN sequence_id = ? THEN 10
                WHEN sequence_id BETWEEN ? AND ? THEN 10 - (? - sequence_id)
                WHEN sequence_id > ? THEN 10 + (sequence_id - ?)
                ELSE app_box END
            WHERE sequence_id BETWEEN ? AND ?
        `);

        const startTime = Date.now();

        const updateTransaction = db.transaction(() => {

            updateStmt.run(
                targetSeq,
                startSeq,
                targetSeq - 1,
                targetSeq,
                targetSeq,
                targetSeq,
                startSeq,
                56500
            );
        });

        updateTransaction();

        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`更新 app_box 耗时: ${elapsed.toFixed(3)} 秒`);

        db.close();
        return "done";
    } catch (error) {
        return `error: ${error.message}`;
    }
}

function check_prohibit_date() {

    const boxValue = which_now_box();

    switch (boxValue) {
        case 999999:
            return 404;
        case 909909:
            return 904;
        default:
            return 200;
    }
}

function four_time(h1) {
    const startTime = Date.now();

    try {

        const a0 = getLocalUTCTimestamp();
        const a1 = which_now_box();
        const a2 = calculateOffsetSeconds(h1);
        const a9 = utc_cut();

        const dbPath = path.join(userData, 'twenty_thousand.db');
        const db = new Database(dbPath);

        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = OFF');
        db.pragma('cache_size = 10000');
        db.pragma('temp_store = MEMORY');
        db.pragma('mmap_size = 268435456'); 

        const updateTransaction = db.transaction(() => {

            const c1Row = db.prepare('SELECT * FROM time_intervals WHERE app_box = ?').get(a1);

            if (!c1Row) {
                throw new Error('找不到对应的 app_box 行');
            }

            const c1SequenceId = c1Row.sequence_id;
            db.prepare('UPDATE time_intervals SET timestamp_end = ? WHERE sequence_id = ?')
                .run(a0, c1SequenceId);

            let a10 = a2 + a9; 

            if (a10 < a0) {
                a10 += 86400;
            }

            const c2SequenceId = c1SequenceId + 1;
            const maxSequenceId = 56500;

            const updateStmt = db.prepare(`
                UPDATE time_intervals 
                SET timestamp_start = ?, timestamp_end = ? 
                WHERE sequence_id = ?
            `);

            let currentStart = a10;
            let currentEnd = a10 + 86399;

            for (let currentSequenceId = c2SequenceId; currentSequenceId <= maxSequenceId; currentSequenceId++) {

                const rowExists = db.prepare('SELECT COUNT(*) as count FROM time_intervals WHERE sequence_id = ?')
                    .get(currentSequenceId).count > 0;

                if (!rowExists) {
                    break;
                }

                updateStmt.run(currentStart, currentEnd, currentSequenceId);

                currentStart += 86400;
                currentEnd += 86400;
            }
        });

        updateTransaction();

        const endTime = Date.now();
        const executionTime = (endTime - startTime) / 1000;
        console.log(`four_time() 执行耗时: ${executionTime.toFixed(4)} 秒`);

        db.close();
        return "done";

    } catch (error) {
        const endTime = Date.now();
        const executionTime = (endTime - startTime) / 1000;
        console.log(`four_time() 执行失败，耗时: ${executionTime.toFixed(4)} 秒`);
        console.error('错误详情:', error.message);
        return "error";
    }
}

function runFourTimeSession(h1, h2) {

    const configURL = path.join(userData, 'config.json');
    const h11 = AdditionConvertSubtraction(h1);

    const step1Result = two_convert_one(h11, h2);
    const step2Result = convert_24h(step1Result);
    const u1 = convertAdditionOffset(step2Result);

    try {
        const configData = fs.readFileSync(configURL, 'utf8');
        const configDict = JSON.parse(configData);

        let twoOffsetTime = configDict.two_offset_time;
        const threeOffsetTime = configDict.three_offset_time;

        if (!twoOffsetTime || !threeOffsetTime) {
            return "Error: Cannot find required offset times in config.json";
        }

        twoOffsetTime = AdditionConvertSubtraction(twoOffsetTime);

        const configStep1Result = two_convert_one(twoOffsetTime, threeOffsetTime);
        const configStep2Result = convert_24h(configStep1Result);
        const u2 = convertAdditionOffset(configStep2Result);

        const mutableConfig = { ...configDict };

        mutableConfig.two_offset_time = h1;
        mutableConfig.three_offset_time = h2;

        if (u1 === u2) {

            fs.writeFileSync(configURL, JSON.stringify(mutableConfig, null, 2));
            return "done";
        } else {

            const fourTimeResult = four_time(u1);

            if (fourTimeResult === "done") {

                const currentTimestamp = String(Math.floor(Date.now() / 1000));
                mutableConfig.prohibit_change_timezone_timestamp = currentTimestamp;

                fs.writeFileSync(configURL, JSON.stringify(mutableConfig, null, 2));
                return "done";
            } else {
                return "Error: four_time function did not return 'done'";
            }
        }
    } catch (error) {
        return "Error: Cannot read config.json";
    }
}

function check_3_day() {

    const status = check_today_finish();
    if (status === 404) {
        return 333;
    }

    try {

        const configURL = path.join(userData, 'config.json');

        const configData = fs.readFileSync(configURL, 'utf8');
        const config = JSON.parse(configData);

        const timestampString = config.prohibit_change_timezone_timestamp;
        const timestamp = parseInt(timestampString);

        if (!timestampString || isNaN(timestamp)) {
            return 904;  
        }

        const a1 = timestamp + 259200;  

        const a2 = Math.floor(Date.now() / 1000);

        return a2 > a1 ? 111 : 222;

    } catch (error) {
        return 904;  
    }
}

function what_two_offset_time() {
    try {

        const configURL = path.join(userData, 'config.json');

        const data = fs.readFileSync(configURL, 'utf8');

        const json = JSON.parse(data);

        const twoOffsetTime = json.two_offset_time;

        if (!twoOffsetTime) {
            return "error";
        }

        return twoOffsetTime;

    } catch (error) {
        return "error";
    }
}

function what_three_offset_time() {
    try {

        const configURL = path.join(userData, 'config.json');

        const data = fs.readFileSync(configURL, 'utf8');

        const json = JSON.parse(data);

        const threeOffsetTime = json.three_offset_time;

        if (!threeOffsetTime) {
            return "error";
        }

        return threeOffsetTime;

    } catch (error) {
        return "error";
    }
}

function add_to_self_dictionary_db(book_name, book_content) {
    try {

        const dbPath = path.join(userData, 'self_dictionary.db');
        const db = new Database(dbPath);

        const foundationPath = path.join(userData, 'foundation.json');
        const foundationData = JSON.parse(fs.readFileSync(foundationPath, 'utf8'));

        const wordToIdMap = {};
        foundationData.forEach(item => {
            wordToIdMap[item.word] = item.id;
        });

        const maxIdQuery = db.prepare('SELECT MAX(book_id) as max_id FROM db_table');
        const result = maxIdQuery.get();
        const newBookId = (result.max_id || 0) + 1;

        const currentTimestamp = Math.floor(Date.now() / 1000);

        const words = book_content.split('|').filter(word => word.trim() !== '');
        const processedIds = [];

        words.forEach(word => {
            if (wordToIdMap[word]) {
                processedIds.push(wordToIdMap[word]);
            }
        });

        const finalBookContent = processedIds.map(id => id + '|').join('');

        const insertQuery = db.prepare(`
            INSERT INTO db_table (book_id, book_timestamp, book_name, book_content)
            VALUES (?, ?, ?, ?)
        `);

        insertQuery.run(newBookId, currentTimestamp, book_name, finalBookContent);

        db.close();

        console.log(`成功添加记录: book_id=${newBookId}, book_name=${book_name}, book_content=${finalBookContent}`);

        return 200;

    } catch (error) {
        console.error('添加记录时出错:', error);
        return 904904;
    }
}

function modify_to_self_dictionary_db(book_id, book_name, book_content) {
    try {

        const dbPath = path.join(userData, 'self_dictionary.db');
        const db = new Database(dbPath);

        const foundationPath = path.join(userData, 'foundation.json');
        const foundationData = JSON.parse(fs.readFileSync(foundationPath, 'utf8'));

        const wordToIdMap = {};
        foundationData.forEach(item => {
            wordToIdMap[item.word] = item.id;
        });

        const words = book_content.split('|').filter(word => word.trim() !== '');
        const idList = [];

        words.forEach(word => {
            if (wordToIdMap[word]) {
                idList.push(wordToIdMap[word]);
            }
        });

        const newBookContent = idList.length > 0 ? idList.map(id => id + '|').join('') : '';

        const currentTimestamp = Math.floor(Date.now() / 1000);

        const updateStmt = db.prepare(`
            UPDATE db_table 
            SET book_timestamp = ?, book_name = ?, book_content = ? 
            WHERE book_id = ?
        `);

        const result = updateStmt.run(currentTimestamp, book_name, newBookContent, book_id);

        db.close();

        if (result.changes > 0) {
            console.log(`成功更新book_id为${book_id}的记录`);
            return 200;
        } else {
            console.log(`未找到book_id为${book_id}的记录`);
            return 904904;
        }

    } catch (error) {
        console.error('更新数据库时出错:', error);
        return 904904;
    }
}

function remove_to_self_dictionary_db(book_id) {
    try {

        const dbPath = path.join(userData, 'self_dictionary.db');

        if (!fs.existsSync(dbPath)) {
            return 904904;
        }

        const db = new Database(dbPath);

        const deleteStmt = db.prepare('DELETE FROM db_table WHERE book_id = ?');

        const result = deleteStmt.run(book_id);

        db.close();

        if (result.changes > 0) {
            return 200;
        } else {

            return 904904;
        }

    } catch (error) {

        return 904904;
    }
}

function remove_content_inner_id_from_book(book_id, content_inner_id) {
    try {

        const dbPath = path.join(userData, 'self_dictionary.db');
        const db = new Database(dbPath);

        const selectStmt = db.prepare(`
            SELECT book_content FROM db_table WHERE book_id = ?
        `);
        const row = selectStmt.get(book_id);

        if (!row) {
            db.close();
            console.log(`未找到book_id为${book_id}的记录`);
            return 904904;
        }

        let book_content = row.book_content || "";

        let ids = book_content.split('|').filter(id => id.trim() !== "" && id !== String(content_inner_id));

        let newBookContent = ids.length > 0 ? ids.map(id => id + '|').join('') : '';

        const currentTimestamp = Math.floor(Date.now() / 1000);

        const updateStmt = db.prepare(`
            UPDATE db_table 
            SET book_timestamp = ?, book_content = ?
            WHERE book_id = ?
        `);
        const result = updateStmt.run(currentTimestamp, newBookContent, book_id);

        db.close();

        if (result.changes > 0) {
            console.log(`成功更新book_id为${book_id}的记录`);
            return 200;
        } else {
            console.log(`未找到book_id为${book_id}的记录`);
            return 904904;
        }
    } catch (error) {
        console.error('更新数据库时出错:', error);
        return 904904;
    }
}

const ensureReserveDir = () => {
  const functionName = 'ensureReserveDir';
  console.log(`[${functionName}] - Function started.`);

  const reservePath = path.join(userData, 'reserve');
  console.log(`[${functionName}] - Reserve path is: ${reservePath}`);

  if (!fs.existsSync(reservePath)) {
    console.log(`[${functionName}] - Reserve path does not exist. Creating it.`);
    try {
      fs.mkdirSync(reservePath, { recursive: true });
      console.log(`[${functionName}] - Successfully created directory: ${reservePath}`);
    } catch (error) {
      console.error(`[${functionName}] - Failed to create directory: ${reservePath}`, error);
      throw error;
    }
  } else {
    console.log(`[${functionName}] - Reserve path already exists.`);
  }

  console.log(`[${functionName}] - Function finished, returning path: ${reservePath}`);
  return reservePath;
};

const backupSQLiteDB = (sourceFile, tableName, targetFile) => {
  const functionName = 'backupSQLiteDB';
  console.log(`[${functionName}] - Started for source: ${sourceFile}, table: ${tableName}, target: ${targetFile}`);

  try {
    console.log(`[${functionName}] - Ensuring reserve directory exists.`);
    const reservePath = ensureReserveDir();

    const sourcePath = path.join(userData, sourceFile);
    const targetPath = path.join(reservePath, targetFile);
    console.log(`[${functionName}] - Source path: ${sourcePath}`);
    console.log(`[${functionName}] - Target path: ${targetPath}`);

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source database file does not exist: ${sourcePath}`);
    }

    if (fs.existsSync(targetPath)) {
      console.log(`[${functionName}] - Old backup file exists at ${targetPath}. Deleting it.`);
      fs.unlinkSync(targetPath);
    }

    console.log(`[${functionName}] - Step 1: Reading all data from source DB.`);
    const db = new Database(sourcePath, { readonly: true });
    console.log(`[${functionName}] - Opened readonly connection to ${sourcePath}.`);

    const columns = db.pragma(`table_info(${tableName})`).map(col => col.name);
    console.log(`[${functionName}] - Fetched columns for table '${tableName}': ${columns.join(', ')}`);

    const placeholders = columns.map(() => '?').join(', ');

    const selectQuery = `SELECT * FROM ${tableName}`;
    console.log(`[${functionName}] - Preparing to execute: ${selectQuery}`);
    const rows = db.prepare(selectQuery).all();
    console.log(`[${functionName}] - Fetched ${rows.length} rows from source table.`);

    const createTableSQLQuery = `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`;
    console.log(`[${functionName}] - Fetching CREATE TABLE statement for '${tableName}'.`);
    const createTableSQLResult = db.prepare(createTableSQLQuery).get(tableName);
    if (!createTableSQLResult || !createTableSQLResult.sql) {
        db.close();
        throw new Error(`Could not retrieve CREATE TABLE statement for table '${tableName}'.`);
    }
    const createTableSQL = createTableSQLResult.sql;
    console.log(`[${functionName}] - Retrieved CREATE TABLE SQL: ${createTableSQL}`);

    db.close();
    console.log(`[${functionName}] - Closed connection to source DB.`);

    console.log(`[${functionName}] - Step 2: Creating new database and table structure.`);
    const newDB = new Database(targetPath);
    console.log(`[${functionName}] - Created/Opened new DB at ${targetPath}.`);

    newDB.exec(createTableSQL);
    console.log(`[${functionName}] - Executed CREATE TABLE statement in target DB.`);

    console.log(`[${functionName}] - Step 3: Performing high-speed bulk insert.`);
    if (rows.length > 0) {
        const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        console.log(`[${functionName}] - Preparing insert statement: ${insertSQL}`);
        const insert = newDB.prepare(insertSQL);

        console.log(`[${functionName}] - Converting rows to value arrays for insertion.`);
        const values = rows.map(row => columns.map(col => row[col] === null ? null : row[col]));

        console.log(`[${functionName}] - Starting transaction for bulk insert of ${values.length} rows.`);
        const transaction = newDB.transaction((vals) => {
          for (const val of vals) insert.run(val);
        });
        transaction(values);
        console.log(`[${functionName}] - Transaction completed successfully.`);
    } else {
        console.log(`[${functionName}] - No rows to insert. Skipping insertion.`);
    }

    newDB.close();
    console.log(`[${functionName}] - Closed connection to new DB.`);

    console.log(`[${functionName}] - Backup successful for ${sourceFile}. Returning 200.`);
    return 200;
  } catch (error) {
    console.error(`[${functionName}] - Backup failed for ${sourceFile}:`, error);
    return 904904;
  }
};

const convey_self_dictionary_db = () => {
  const functionName = 'convey_self_dictionary_db';
  console.log(`[${functionName}] - Starting backup.`);
  const result = backupSQLiteDB('self_dictionary.db', 'db_table', 'self_dictionary.db');
  console.log(`[${functionName}] - Backup finished with result: ${result}.`);
  return result;
};

const convey_self_now_db = () => {
  const functionName = 'convey_self_now_db';
  console.log(`[${functionName}] - Starting backup.`);
  const result = backupSQLiteDB('self_now.db', 'my_table', 'self_now.db');
  console.log(`[${functionName}] - Backup finished with result: ${result}.`);
  return result;
};

const convey_twenty_thousand_db = () => {
  const functionName = 'convey_twenty_thousand_db';
  console.log(`[${functionName}] - Starting backup.`);
  const result = backupSQLiteDB('twenty_thousand.db', 'time_intervals', 'twenty_thousand.db');
  console.log(`[${functionName}] - Backup finished with result: ${result}.`);
  return result;
};

const convey_config_json = () => {
  const functionName = 'convey_config_json';
  console.log(`[${functionName}] - Starting backup.`);
  try {
    console.log(`[${functionName}] - Ensuring reserve directory exists.`);
    const reservePath = ensureReserveDir();

    const sourcePath = path.join(userData, 'config.json');
    const targetPath = path.join(reservePath, 'config.json');
    console.log(`[${functionName}] - Source path: ${sourcePath}`);
    console.log(`[${functionName}] - Target path: ${targetPath}`);

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source config file does not exist: ${sourcePath}`);
    }

    console.log(`[${functionName}] - Reading data from source file.`);
    const data = fs.readFileSync(sourcePath, 'utf8');
    console.log(`[${functionName}] - Read ${data.length} bytes from ${sourcePath}.`);

    console.log(`[${functionName}] - Writing data to target file.`);
    fs.writeFileSync(targetPath, data);
    console.log(`[${functionName}] - Successfully wrote to ${targetPath}.`);

    console.log(`[${functionName}] - Config backup successful. Returning 200.`);
    return 200;
  } catch (error) {
    console.error(`[${functionName}] - Config backup failed:`, error);
    return 904904;
  }
};

const verify_and_uncompress = () => {
  const functionName = 'verify_and_uncompress';
  console.log(`[${functionName}] - Function started.`);
  const reservePath = path.join(userData, 'reserve');
  console.log(`[${functionName}] - Reserve path is: ${reservePath}`);

  try {
    console.log(`[${functionName}] - Step 1: Verifying unique no-extension file in ${reservePath}.`);
    const allFiles = fs.readdirSync(reservePath);
    console.log(`[${functionName}] - All files in directory: [${allFiles.join(', ')}]`);

    const noExtFiles = allFiles.filter(file => {
      const filePath = path.join(reservePath, file);
      const isFile = fs.statSync(filePath).isFile();
      const hasNoExt = !path.extname(file); 
      console.log(`[${functionName}] - Checking file '${file}': isFile=${isFile}, hasNoExt=${hasNoExt}`);
      return isFile && hasNoExt;
    });
    console.log(`[${functionName}] - Found no-extension files: [${noExtFiles.join(', ')}]`);

    if (noExtFiles.length !== 1) {
      throw new Error(`Expected 1 no-extension file, but found ${noExtFiles.length}.`);
    }

    const targetFile = noExtFiles[0];
    const targetPath = path.join(reservePath, targetFile);
    console.log(`[${functionName}] - Unique target file found: ${targetPath}`);

    console.log(`[${functionName}] - Step 2: Checking file size (limit: 5MB).`);
    const stats = fs.statSync(targetPath);
    console.log(`[${functionName}] - File size is ${stats.size} bytes.`);
    if (stats.size > 5 * 1024 * 1024) {
      throw new Error(`File size ${stats.size} exceeds 5MB limit.`);
    }
    console.log(`[${functionName}] - File size is within the limit.`);

    console.log(`[${functionName}] - Step 3: Verifying file prefix (expected: "globspeech_app").`);
    const prefixBuffer = Buffer.alloc(14);
    const fd = fs.openSync(targetPath, 'r');
    console.log(`[${functionName}] - Opened file descriptor for ${targetPath}.`);
    fs.readSync(fd, prefixBuffer, 0, 14, 0);
    console.log(`[${functionName}] - Read 14 bytes from file.`);
    fs.closeSync(fd);
    console.log(`[${functionName}] - Closed file descriptor.`);

    const prefixString = prefixBuffer.toString('utf8');
    console.log(`[${functionName}] - Read prefix is: "${prefixString}"`);
    if (prefixString !== 'globspeech_app') {
      throw new Error('Invalid prefix: expected "globspeech_app"');
    }
    console.log(`[${functionName}] - Prefix is valid.`);

    console.log(`[${functionName}] - Step 4: Creating temporary ZIP file by skipping the prefix.`);
    const tempZipPath = path.join(reservePath, 'temp.zip');
    console.log(`[${functionName}] - Reading full data from ${targetPath}.`);
    const fullData = fs.readFileSync(targetPath);
    console.log(`[${functionName}] - Slicing data from byte 14 onwards.`);
    const zipData = fullData.slice(14);
    console.log(`[${functionName}] - Writing ${zipData.length} bytes to temp zip file: ${tempZipPath}.`);
    fs.writeFileSync(tempZipPath, zipData);

    console.log(`[${functionName}] - Step 5: Decompressing and verifying ZIP content.`);
    const zip = new AdmZip(tempZipPath);
    const zipEntries = zip.getEntries();
    console.log(`[${functionName}] - Found ${zipEntries.length} entries in the ZIP file.`);

    if (zipEntries.length !== 4) {
      throw new Error(`ZIP contains ${zipEntries.length} files, expected 4.`);
    }

    const expectedFiles = new Set(['self_dictionary.db', 'self_now.db', 'twenty_thousand.db', 'config.json']);
    console.log(`[${functionName}] - Expected files are: [${[...expectedFiles].join(', ')}]`);

    const foundFiles = new Set();
    for (const entry of zipEntries) {
      if (entry.isDirectory) {
        console.log(`[${functionName}] - Skipping directory entry: ${entry.entryName}`);
        continue;
      }
      const fileName = entry.entryName;
      console.log(`[${functionName}] - Verifying file in ZIP: ${fileName}`);
      if (!expectedFiles.has(fileName)) {
        throw new Error(`Unexpected file in ZIP: ${fileName}`);
      }
      foundFiles.add(fileName);
    }
    console.log(`[${functionName}] - All filenames in ZIP are expected.`);

    if (foundFiles.size !== 4) {
      throw new Error(`ZIP missing expected files. Found: [${[...foundFiles].join(', ')}]`);
    }
    console.log(`[${functionName}] - ZIP contains all 4 expected files.`);

    console.log(`[${functionName}] - Step 6: Safely extracting all files (overwrite enabled).`);
    zip.extractAllTo(reservePath, true);
    console.log(`[${functionName}] - Extraction complete.`);

    console.log(`[${functionName}] - Step 7: Final verification of filesystem state.`);
    for (const file of expectedFiles) {
      const finalFilePath = path.join(reservePath, file);
      if (!fs.existsSync(finalFilePath)) {
        throw new Error(`Missing expected file after extraction: ${file}`);
      }
      console.log(`[${functionName}] - Verified existence of extracted file: ${file}`);
    }
    console.log(`[${functionName}] - All 4 expected files exist in the directory.`);

    console.log(`[${functionName}] - Step 8: Cleaning up intermediate files.`);
    console.log(`[${functionName}] - Deleting temporary zip file: ${tempZipPath}`);
    fs.unlinkSync(tempZipPath);
    console.log(`[${functionName}] - Deleting original no-extension backup file: ${targetPath}`);
    fs.unlinkSync(targetPath);

    console.log(`[${functionName}] - Verification and uncompression successful. Returning 200.`);
    return 200;
  } catch (error) {
    console.error(`[${functionName}] - Verification failed:`, error);

    console.log(`[${functionName}] - Attempting to clean up temporary files due to error.`);
    try {
      const tempZipPath = path.join(reservePath, 'temp.zip');
      if (fs.existsSync(tempZipPath)) {
        fs.unlinkSync(tempZipPath);
        console.log(`[${functionName}] - Successfully cleaned up ${tempZipPath}.`);
      }
    } catch (cleanupError) {
      console.error(`[${functionName}] - Cleanup failed:`, cleanupError);
    }

    return 904904;
  }
};

const restoreSQLiteDB = (sourceFile, tableName) => {
  const functionName = 'restoreSQLiteDB';
  console.log(`[${functionName}] - Started for source: ${sourceFile}, table: ${tableName}`);

  try {
    const reservePath = path.join(userData, 'reserve');
    const sourcePath = path.join(reservePath, sourceFile);
    const targetPath = path.join(userData, sourceFile);
    console.log(`[${functionName}] - Source path (from reserve): ${sourcePath}`);
    console.log(`[${functionName}] - Target path (to main data): ${targetPath}`);

    console.log(`[${functionName}] - Step 1: Verifying source file exists.`);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file missing in reserve directory: ${sourceFile}`);
    }
    console.log(`[${functionName}] - Source file ${sourcePath} found.`);

    console.log(`[${functionName}] - Step 2: Reading source database structure and data.`);
    const sourceDB = new Database(sourcePath, { readonly: true });
    console.log(`[${functionName}] - Opened readonly connection to ${sourcePath}.`);

    const createTableSQLQuery = `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`;
    console.log(`[${functionName}] - Fetching CREATE TABLE statement for '${tableName}'.`);
    const createTableSQLResult = sourceDB.prepare(createTableSQLQuery).get(tableName);

    if (!createTableSQLResult || !createTableSQLResult.sql) {
      sourceDB.close();
      throw new Error(`Table '${tableName}' not found in source backup file ${sourceFile}`);
    }
    const createTableSQL = createTableSQLResult.sql;
    console.log(`[${functionName}] - Retrieved CREATE TABLE SQL: ${createTableSQL}`);

    const selectQuery = `SELECT * FROM ${tableName}`;
    console.log(`[${functionName}] - Preparing to execute: ${selectQuery}`);
    const rows = sourceDB.prepare(selectQuery).all();
    console.log(`[${functionName}] - Fetched ${rows.length} rows from source table.`);

    sourceDB.close();
    console.log(`[${functionName}] - Closed connection to source DB.`);

    console.log(`[${functionName}] - Step 3: Preparing target database.`);

    if (fs.existsSync(targetPath)) {
        console.log(`[${functionName}] - Deleting existing target database file: ${targetPath}`);
        fs.unlinkSync(targetPath);
    }
    const targetDB = new Database(targetPath);
    console.log(`[${functionName}] - Opened connection to new target DB at ${targetPath}.`);

    console.log(`[${functionName}] - Setting journal_mode to WAL for compatibility.`);
    targetDB.pragma('journal_mode = WAL');

    console.log(`[${functionName}] - Executing CREATE TABLE statement in target DB.`);
    targetDB.exec(createTableSQL);

    console.log(`[${functionName}] - Step 4: Performing high-speed bulk insert.`);
    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      console.log(`[${functionName}] - Columns for insert: ${columns.join(', ')}`);
      const placeholders = columns.map(() => '?').join(', ');

      const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      console.log(`[${functionName}] - Preparing insert statement: ${insertSQL}`);
      const insert = targetDB.prepare(insertSQL);

      console.log(`[${functionName}] - Converting rows to value arrays.`);
      const values = rows.map(row => columns.map(col => (row[col] === null ? null : row[col])));

      console.log(`[${functionName}] - Starting transaction for bulk insert of ${values.length} rows.`);
      const transaction = targetDB.transaction((vals) => {
        for (const val of vals) insert.run(val);
      });
      transaction(values);
      console.log(`[${functionName}] - Transaction completed successfully.`);
    } else {
      console.log(`[${functionName}] - No rows to insert.`);
    }

    targetDB.close();
    console.log(`[${functionName}] - Closed connection to target DB.`);

    console.log(`[${functionName}] - Restore successful for ${sourceFile}. Returning 200.`);
    return 200;
  } catch (error) {
    console.error(`[${functionName}] - Restore failed for ${sourceFile}:`, error);
    return 904904;
  }
};

const reserve_convey_self_dictionary_db = () => {
  const functionName = 'reserve_convey_self_dictionary_db';
  console.log(`[${functionName}] - Starting restore.`);
  const result = restoreSQLiteDB('self_dictionary.db', 'db_table');
  console.log(`[${functionName}] - Restore finished with result: ${result}.`);
  return result;
};

const reserve_convey_self_now_db = () => {
  const functionName = 'reserve_convey_self_now_db';
  console.log(`[${functionName}] - Starting restore.`);
  const result = restoreSQLiteDB('self_now.db', 'my_table');
  console.log(`[${functionName}] - Restore finished with result: ${result}.`);
  return result;
};

const reserve_convey_twenty_thousand_db = () => {
  const functionName = 'reserve_convey_twenty_thousand_db';
  console.log(`[${functionName}] - Starting restore.`);
  const result = restoreSQLiteDB('twenty_thousand.db', 'time_intervals');
  console.log(`[${functionName}] - Restore finished with result: ${result}.`);
  return result;
};

const reserve_convey_config_json = () => {
  const functionName = 'reserve_convey_config_json';
  console.log(`[${functionName}] - Starting restore.`);
  try {
    const reservePath = path.join(userData, 'reserve');
    const sourcePath = path.join(reservePath, 'config.json');
    const targetPath = path.join(userData, 'config.json');
    console.log(`[${functionName}] - Source path: ${sourcePath}`);
    console.log(`[${functionName}] - Target path: ${targetPath}`);

    console.log(`[${functionName}] - Step 1: Verifying source file exists.`);
    if (!fs.existsSync(sourcePath)) {
      throw new Error('Source config.json missing in reserve directory.');
    }
    console.log(`[${functionName}] - Source file found.`);

    console.log(`[${functionName}] - Step 2: Reading, validating, and writing JSON.`);
    let configData;
    try {
      const rawData = fs.readFileSync(sourcePath, 'utf8');
      console.log(`[${functionName}] - Read ${rawData.length} bytes from source.`);

      configData = JSON.parse(rawData);
      console.log(`[${functionName}] - Successfully parsed JSON data.`);

      const normalizedData = JSON.stringify(configData, null, 2);
      console.log(`[${functionName}] - Re-serialized JSON for standardized formatting.`);

      fs.writeFileSync(targetPath, normalizedData);
      console.log(`[${functionName}] - Successfully wrote normalized JSON to ${targetPath}.`);
    } catch (parseError) {
      throw new Error(`Invalid JSON in source config.json: ${parseError.message}`);
    }

    console.log(`[${functionName}] - Config restore successful. Returning 200.`);
    return 200;
  } catch (error) {
    console.error(`[${functionName}] - Config restore failed:`, error);
    return 904904;
  }
};

const getLocalDateFormatted = () => {
  const functionName = 'getLocalDateFormatted';
  console.log(`[${functionName}] - Function started.`);

  const now = new Date();
  console.log(`[${functionName}] - Current date object: ${now.toISOString()}`);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  console.log(`[${functionName}] - Parsed parts: year=${year}, month=${month}, day=${day}`);

  const formattedDate = `export_${year}_${month}_${day}`;
  console.log(`[${functionName}] - Function finished. Returning formatted date: "${formattedDate}"`);
  return formattedDate;
};

const four_compress = () => {
  const functionName = 'four_compress';
  console.log(`[${functionName}] - Function started.`);

  try {
    const reservePath = path.join(userData, 'reserve');
    console.log(`[${functionName}] - Reserve path is: ${reservePath}`);

    console.log(`[${functionName}] - Step 1: Verifying 4 necessary backup files exist.`);
    const requiredFiles = ['self_dictionary.db', 'self_now.db', 'twenty_thousand.db', 'config.json'];
    console.log(`[${functionName}] - Required files: [${requiredFiles.join(', ')}]`);

    const missingFiles = [];
    for (const file of requiredFiles) {
        const filePath = path.join(reservePath, file);
        if (!fs.existsSync(filePath)) {
            console.log(`[${functionName}] - MISSING FILE: ${filePath}`);
            missingFiles.push(file);
        } else {
            console.log(`[${functionName}] - Found file: ${filePath}`);
        }
    }

    if (missingFiles.length > 0) {
      throw new Error(`Missing backup files in reserve directory: ${missingFiles.join(', ')}`);
    }
    console.log(`[${functionName}] - All required files found.`);

    console.log(`[${functionName}] - Step 2: Creating temporary ZIP in memory and deleting original files.`);
    const zip = new AdmZip();
    requiredFiles.forEach(file => {
      const filePath = path.join(reservePath, file);
      console.log(`[${functionName}] - Adding file to ZIP: ${filePath}`);
      zip.addLocalFile(filePath);
      console.log(`[${functionName}] - Deleting original file after adding to ZIP: ${filePath}`);
      fs.unlinkSync(filePath);
    });

    const tempZipPath = path.join(reservePath, 'temp.zip');
    console.log(`[${functionName}] - Writing in-memory ZIP to disk at: ${tempZipPath}`);
    zip.writeZip(tempZipPath);
    console.log(`[${functionName}] - Temporary ZIP file created.`);

    console.log(`[${functionName}] - Step 3: Reading ZIP content and adding prefix.`);
    const zipData = fs.readFileSync(tempZipPath);
    console.log(`[${functionName}] - Read ${zipData.length} bytes from temp ZIP.`);

    const prefix = Buffer.from('globspeech_app', 'utf8');
    console.log(`[${functionName}] - Created prefix buffer: "globspeech_app"`);

    const finalData = Buffer.concat([prefix, zipData]);
    console.log(`[${functionName}] - Concatenated prefix and ZIP data. Total size: ${finalData.length} bytes.`);

    console.log(`[${functionName}] - Step 4: Creating temporary no-extension file.`);
    const tempFilePath = path.join(reservePath, 'temp');
    console.log(`[${functionName}] - Writing final data to: ${tempFilePath}`);
    fs.writeFileSync(tempFilePath, finalData, { flag: 'wx' });
    console.log(`[${functionName}] - Temporary file created.`);

    console.log(`[${functionName}] - Step 5: Deleting temporary ZIP file.`);
    fs.unlinkSync(tempZipPath);
    console.log(`[${functionName}] - Deleted ${tempZipPath}.`);

    console.log(`[${functionName}] - Step 6: Renaming to final date-formatted file.`);
    const finalFileName = getLocalDateFormatted();
    const finalFilePath = path.join(reservePath, finalFileName);
    console.log(`[${functionName}] - Renaming ${tempFilePath} to ${finalFilePath}`);
    fs.renameSync(tempFilePath, finalFilePath);
    console.log(`[${functionName}] - Rename complete.`);

    console.log(`[${functionName}] - Compression successful. Returning 200.`);
    return 200;
  } catch (error) {
    console.error(`[${functionName}] - Compression failed:`, error);
    return 904904;
  }
};

function processWordsWithLemmatization(inputString) {

    if (!processWordsWithLemmatization.cache) {
        processWordsWithLemmatization.cache = {};
    }

    const cache = processWordsWithLemmatization.cache;

    try {

        if (!cache.initialized) {
            console.log("正在初始化缓存...");
            const foundationPath = path.join(userData, 'foundation.json');
            const frequencyPath = path.join(userData, 'Frequency_list.txt');

            const foundationData = JSON.parse(fs.readFileSync(foundationPath, 'utf8'));
            const frequencyContent = fs.readFileSync(frequencyPath, 'utf8');
            const frequencyList = frequencyContent.split('\n').filter(line => line.trim() !== '');

            cache.wordToIdMap = new Map();
            foundationData.forEach(item => {
                cache.wordToIdMap.set(item.word, item.id);
            });

            cache.wordToFrequencyMap = new Map();
            frequencyList.forEach((word, index) => {
                cache.wordToFrequencyMap.set(word.trim(), index + 1);
            });

            cache.initialized = true;
            console.log("缓存初始化完成。");
        }

        const words = inputString.split('|').filter(word => word.trim() !== '');
        if (words.length === 0) {
            const result = "zero_word";
            console.log("最终输出: ", result);
            return result;
        }

        if (!cache.compromise) {

            const compromisePath = path.join(userData, 'compromise.js');
            console.log(`正在从 ${compromisePath} 加载 compromise 模块...`);
            cache.compromise = require(compromisePath);
        }

        const validWordsWithData = [];

        for (const word of words) {
            const trimmedWord = word.trim();
            if (!trimmedWord) continue;

            let lemma = trimmedWord;
            try {
                const doc = cache.compromise(trimmedWord);
                if (doc.has('#Verb')) {
                    const infinitive = doc.verbs().toInfinitive().text();
                    if (infinitive) lemma = infinitive;
                } else if (doc.has('#Noun')) {
                    const singular = doc.nouns().toSingular().text();
                    if (singular) lemma = singular;
                }
            } catch (e) {

            }

            if (cache.wordToIdMap.has(lemma)) {
                const frequency = cache.wordToFrequencyMap.get(lemma);
                if (frequency !== undefined) {
                    validWordsWithData.push({
                        word: lemma,
                        frequency: frequency,
                        id: cache.wordToIdMap.get(lemma)
                    });
                }
            }
        }

        if (validWordsWithData.length === 0) {
            const result = "zero_word";
            console.log("最终输出: ", result);
            return result;
        }

        validWordsWithData.sort((a, b) => b.frequency - a.frequency);

        const sortedIds = validWordsWithData.map(item => item.id);

        const uniqueIds = [...new Set(sortedIds)];

        const finalResult = uniqueIds.join('|') + '|';

        console.log("最终输出: ", finalResult);

        return finalResult;

    } catch (error) {
        console.error('处理单词时发生错误:', error);
        const result = "unknown_error";
        console.log("最终输出: ", result);
        return result;
    }
}

function all_sequence_Lemmatization_word(inputString) {
    const functionName = 'all_sequence_Lemmatization_word';
    console.log(`[${functionName}] - Function started with input: "${inputString}"`);

    if (!all_sequence_Lemmatization_word.cache) {
        console.log(`[${functionName}] - Cache does not exist. Creating it.`);
        all_sequence_Lemmatization_word.cache = {
            wordToIdMap: null,
            initialized: false,
            compromise: null 
        };
    }

    const cache = all_sequence_Lemmatization_word.cache;

    try {
        if (!cache.initialized) {
            console.log(`[${functionName}] - Initializing cache...`);
            const foundationPath = path.join(userData, 'foundation.json');
            console.log(`[${functionName}] - Loading foundation data from: ${foundationPath}`);
            const foundationData = JSON.parse(fs.readFileSync(foundationPath, 'utf8'));

            cache.wordToIdMap = new Map();
            foundationData.forEach(item => {
                cache.wordToIdMap.set(item.word.toLowerCase(), item.id);
            });
            console.log(`[${functionName}] - Created wordToIdMap with ${cache.wordToIdMap.size} entries.`);

            cache.initialized = true;
            console.log(`[${functionName}] - Cache initialization complete.`);
        }

        console.log(`[${functionName}] - Processing input string.`);
        const words = inputString.split('|').filter(word => word.trim() !== '');
        console.log(`[${functionName}] - Split input into ${words.length} words: [${words.join(', ')}]`);

        if (words.length === 0) {
            console.log(`[${functionName}] - No valid words found. Returning "zero_word".`);
            return "zero_word";
        }

        if (!cache.compromise) {
            console.log(`[${functionName}] - Loading compromise module from userData.`);
            const compromisePath = path.join(userData, 'compromise.js');
            cache.compromise = require(compromisePath);
        }
        const compromise = cache.compromise;

        const validWords = [];
        const seenLemmas = new Set(); 

        for (const word of words) {
            const trimmedWord = word.trim().toLowerCase();
            console.log(`[${functionName}] - Processing word: '${trimmedWord}'`);

            if (!trimmedWord) {
                console.log(`[${functionName}] - Skipping empty word.`);
                continue;
            }

            let lemma = trimmedWord;
            try {
                const doc = compromise(trimmedWord); 
                let newLemma = lemma;
                if (doc.has('#Verb')) {
                    const infinitive = doc.verbs().toInfinitive().text().toLowerCase();
                    if (infinitive) newLemma = infinitive;
                } else if (doc.has('#Noun')) {
                    const singular = doc.nouns().toSingular().text().toLowerCase();
                    if (singular) newLemma = singular;
                }
                if (newLemma !== lemma) {
                    console.log(`[${functionName}] - Lemmatized '${trimmedWord}' to '${newLemma}'`);
                    lemma = newLemma;
                } else {
                    console.log(`[${functionName}] - No lemmatization needed for '${trimmedWord}'`);
                }
            } catch (e) {
                console.error(`[${functionName}] - Compromise lemmatization failed for '${trimmedWord}'. Using original.`, e);
            }

            if (seenLemmas.has(lemma)) {
                console.log(`[${functionName}] - Skipping already processed lemma: '${lemma}'`);
                continue;
            }

            console.log(`[${functionName}] - Validating lemma '${lemma}' against foundation.json.`);
            if (cache.wordToIdMap.has(lemma)) {
                console.log(`[${functionName}] - Lemma '${lemma}' is valid. Adding to results.`);
                seenLemmas.add(lemma);
                validWords.push(lemma);
            } else {
                console.log(`[${functionName}] - Lemma '${lemma}' is NOT in foundation.json.`);
            }
        }

        const result = validWords.length > 0 ? validWords.join('|') + '|' : "zero_word";
        console.log(`[${functionName}] - Function finished. Returning: "${result}"`);
        return result;

    } catch (error) {
        console.error(`[${functionName}] - An error occurred:`, error);
        return "unknown_error";
    }
}

function novel_sequence_Lemmatization_word(inputString) {
    const functionName = 'novel_sequence_Lemmatization_word';
    console.log(`[${functionName}] - Function started with input: "${inputString}"`);

    if (!novel_sequence_Lemmatization_word.cache) {
        console.log(`[${functionName}] - Cache does not exist. Creating it.`);
        novel_sequence_Lemmatization_word.cache = {
            wordToIdMap: null,
            initialized: false,
            compromise: null 
        };
    }

    const cache = novel_sequence_Lemmatization_word.cache;
    let db; 

    try {
        if (!cache.initialized) {
            console.log(`[${functionName}] - Initializing cache...`);
            const foundationPath = path.join(userData, 'foundation.json');
            console.log(`[${functionName}] - Loading foundation data from: ${foundationPath}`);
            const foundationData = JSON.parse(fs.readFileSync(foundationPath, 'utf8'));

            cache.wordToIdMap = new Map();
            foundationData.forEach(item => {
                cache.wordToIdMap.set(item.word.toLowerCase(), item.id);
            });
            console.log(`[${functionName}] - Created wordToIdMap with ${cache.wordToIdMap.size} entries.`);

            cache.initialized = true;
            console.log(`[${functionName}] - Cache initialization complete.`);
        }

        console.log(`[${functionName}] - Opening readonly database connection to self_now.db`);
        const dbPath = path.join(userData, 'self_now.db');
        db = new Database(dbPath, { readonly: true });

        console.log(`[${functionName}] - Fetching all existing word_ids from my_table.`);
        const rows = db.prepare("SELECT DISTINCT word_id FROM my_table").all();
        const existingWordIds = new Set(rows.map(row => row.word_id));
        console.log(`[${functionName}] - Found ${existingWordIds.size} existing word_ids in the database.`);

        console.log(`[${functionName}] - Processing input string.`);
        const words = inputString.split('|').filter(word => word.trim() !== '');
        console.log(`[${functionName}] - Split input into ${words.length} words: [${words.join(', ')}]`);

        if (words.length === 0) {
            console.log(`[${functionName}] - No valid words found. Returning "zero_word".`);
            return "zero_word";
        }

        if (!cache.compromise) {
            console.log(`[${functionName}] - Loading compromise module from userData.`);
            const compromisePath = path.join(userData, 'compromise.js');
            cache.compromise = require(compromisePath);
        }
        const compromise = cache.compromise;

        const validWords = [];
        const seenLemmas = new Set();

        for (const word of words) {
            const trimmedWord = word.trim().toLowerCase();
            console.log(`[${functionName}] - Processing word: '${trimmedWord}'`);

            if (!trimmedWord) {
                console.log(`[${functionName}] - Skipping empty word.`);
                continue;
            }

            let lemma = trimmedWord;
            try {
                const doc = compromise(trimmedWord); 
                let newLemma = lemma;
                if (doc.has('#Verb')) {
                    const infinitive = doc.verbs().toInfinitive().text().toLowerCase();
                    if (infinitive) newLemma = infinitive;
                } else if (doc.has('#Noun')) {
                    const singular = doc.nouns().toSingular().text().toLowerCase();
                    if (singular) newLemma = singular;
                }
                if (newLemma !== lemma) {
                    console.log(`[${functionName}] - Lemmatized '${trimmedWord}' to '${newLemma}'`);
                    lemma = newLemma;
                } else {
                    console.log(`[${functionName}] - No lemmatization needed for '${trimmedWord}'`);
                }
            } catch (e) {
                console.error(`[${functionName}] - Compromise lemmatization failed for '${trimmedWord}'. Using original.`, e);
            }

            if (seenLemmas.has(lemma)) {
                console.log(`[${functionName}] - Skipping already processed lemma: '${lemma}'`);
                continue;
            }

            console.log(`[${functionName}] - Validating lemma '${lemma}' against foundation.json.`);
            if (cache.wordToIdMap.has(lemma)) {
                const wordId = cache.wordToIdMap.get(lemma);
                console.log(`[${functionName}] - Lemma '${lemma}' is valid (ID: ${wordId}). Checking if it exists in DB.`);
                if (!existingWordIds.has(wordId)) {
                    console.log(`[${functionName}] - Word ID ${wordId} is novel. Adding '${lemma}' to results.`);
                    seenLemmas.add(lemma);
                    validWords.push(lemma);
                } else {
                    console.log(`[${functionName}] - Word ID ${wordId} already exists in DB. Skipping.`);
                }
            } else {
                console.log(`[${functionName}] - Lemma '${lemma}' is NOT in foundation.json.`);
            }
        }

        const result = validWords.length > 0 ? validWords.join('|') + '|' : "zero_word";
        console.log(`[${functionName}] - Function finished. Returning: "${result}"`);
        return result;

    } catch (error) {
        console.error(`[${functionName}] - An error occurred:`, error);
        return "unknown_error";
    } finally {
        if (db) {
            console.log(`[${functionName}] - Closing database connection.`);
            db.close();
        }
    }
}

function all_frequency_Lemmatization_word(inputString) {
    const functionName = 'all_frequency_Lemmatization_word';
    console.log(`[${functionName}] - Function started with input: "${inputString}"`);

    if (!all_frequency_Lemmatization_word.cache) {
        console.log(`[${functionName}] - Cache does not exist. Creating it.`);
        all_frequency_Lemmatization_word.cache = {
            wordToIdMap: null,
            wordToFrequency: null,
            initialized: false,
            compromise: null 
        };
    }

    const cache = all_frequency_Lemmatization_word.cache;

    try {
        if (!cache.initialized) {
            console.log(`[${functionName}] - Initializing cache...`);
            const foundationPath = path.join(userData, 'foundation.json');
            const frequencyPath = path.join(userData, 'Frequency_list.txt');

            console.log(`[${functionName}] - Loading foundation data from: ${foundationPath}`);
            const foundationData = JSON.parse(fs.readFileSync(foundationPath, 'utf8'));
            cache.wordToIdMap = new Map();
            foundationData.forEach(item => {
                cache.wordToIdMap.set(item.word.toLowerCase(), item.id);
            });
            console.log(`[${functionName}] - Created wordToIdMap with ${cache.wordToIdMap.size} entries.`);

            console.log(`[${functionName}] - Loading frequency list from: ${frequencyPath}`);
            const frequencyContent = fs.readFileSync(frequencyPath, 'utf8');
            const frequencyList = frequencyContent.split('\n').filter(line => line.trim() !== '');
            cache.wordToFrequency = new Map();
            frequencyList.forEach((word, index) => {
                cache.wordToFrequency.set(word.trim().toLowerCase(), index + 1); 
            });
            console.log(`[${functionName}] - Created wordToFrequency map with ${cache.wordToFrequency.size} entries.`);

            cache.initialized = true;
            console.log(`[${functionName}] - Cache initialization complete.`);
        }

        console.log(`[${functionName}] - Processing input string.`);
        const words = inputString.split('|').filter(word => word.trim() !== '');
        console.log(`[${functionName}] - Split input into ${words.length} words: [${words.join(', ')}]`);

        if (words.length === 0) {
            console.log(`[${functionName}] - No valid words found. Returning "zero_word".`);
            return "zero_word";
        }

        if (!cache.compromise) {
            console.log(`[${functionName}] - Loading compromise module from userData.`);
            const compromisePath = path.join(userData, 'compromise.js');
            cache.compromise = require(compromisePath);
        }
        const compromise = cache.compromise;

        const validWords = [];
        const seenLemmas = new Set();

        for (const word of words) {
            const trimmedWord = word.trim().toLowerCase();
            console.log(`[${functionName}] - Processing word: '${trimmedWord}'`);

            if (!trimmedWord) {
                console.log(`[${functionName}] - Skipping empty word.`);
                continue;
            }

            let lemma = trimmedWord;
            try {
                const doc = compromise(trimmedWord); 
                let newLemma = lemma;
                if (doc.has('#Verb')) {
                    const infinitive = doc.verbs().toInfinitive().text().toLowerCase();
                    if (infinitive) newLemma = infinitive;
                } else if (doc.has('#Noun')) {
                    const singular = doc.nouns().toSingular().text().toLowerCase();
                    if (singular) newLemma = singular;
                }
                if (newLemma !== lemma) {
                    console.log(`[${functionName}] - Lemmatized '${trimmedWord}' to '${newLemma}'`);
                    lemma = newLemma;
                } else {
                    console.log(`[${functionName}] - No lemmatization needed for '${trimmedWord}'`);
                }
            } catch (e) {
                console.error(`[${functionName}] - Compromise lemmatization failed for '${trimmedWord}'. Using original.`, e);
            }

            if (seenLemmas.has(lemma)) {
                console.log(`[${functionName}] - Skipping already processed lemma: '${lemma}'`);
                continue;
            }

            console.log(`[${functionName}] - Validating lemma '${lemma}' against foundation.json.`);
            if (cache.wordToIdMap.has(lemma)) {
                console.log(`[${functionName}] - Lemma '${lemma}' is valid. Adding to sortable list.`);
                seenLemmas.add(lemma);
                validWords.push(lemma);
            } else {
                console.log(`[${functionName}] - Lemma '${lemma}' is NOT in foundation.json.`);
            }
        }

        console.log(`[${functionName}] - Sorting ${validWords.length} valid words by frequency (low frequency first).`);
        validWords.sort((a, b) => {

            const freqA = cache.wordToFrequency.get(a) || Infinity;
            const freqB = cache.wordToFrequency.get(b) || Infinity;
            return freqB - freqA; 
        });
        console.log(`[${functionName}] - Sorted words: [${validWords.join(', ')}]`);

        const result = validWords.length > 0 ? validWords.join('|') + '|' : "zero_word";
        console.log(`[${functionName}] - Function finished. Returning: "${result}"`);
        return result;

    } catch (error) {
        console.error(`[${functionName}] - An error occurred:`, error);
        return "unknown_error";
    }
}

function novel_frequency_Lemmatization_word(inputString) {
    const functionName = 'novel_frequency_Lemmatization_word';
    console.log(`[${functionName}] - Function started with input: "${inputString}"`);

    if (!novel_frequency_Lemmatization_word.cache) {
        console.log(`[${functionName}] - Cache does not exist. Creating it.`);
        novel_frequency_Lemmatization_word.cache = {
            wordToIdMap: null,
            wordToFrequency: null,
            initialized: false,
            compromise: null 
        };
    }

    const cache = novel_frequency_Lemmatization_word.cache;
    let db;

    try {
        if (!cache.initialized) {
            console.log(`[${functionName}] - Initializing cache...`);
            const foundationPath = path.join(userData, 'foundation.json');
            const frequencyPath = path.join(userData, 'Frequency_list.txt');

            console.log(`[${functionName}] - Loading foundation data from: ${foundationPath}`);
            const foundationData = JSON.parse(fs.readFileSync(foundationPath, 'utf8'));
            cache.wordToIdMap = new Map();
            foundationData.forEach(item => {
                cache.wordToIdMap.set(item.word.toLowerCase(), item.id);
            });
            console.log(`[${functionName}] - Created wordToIdMap with ${cache.wordToIdMap.size} entries.`);

            console.log(`[${functionName}] - Loading frequency list from: ${frequencyPath}`);
            const frequencyContent = fs.readFileSync(frequencyPath, 'utf8');
            const frequencyList = frequencyContent.split('\n').filter(line => line.trim() !== '');
            cache.wordToFrequency = new Map();
            frequencyList.forEach((word, index) => {
                cache.wordToFrequency.set(word.trim().toLowerCase(), index + 1);
            });
            console.log(`[${functionName}] - Created wordToFrequency map with ${cache.wordToFrequency.size} entries.`);

            cache.initialized = true;
            console.log(`[${functionName}] - Cache initialization complete.`);
        }

        console.log(`[${functionName}] - Opening readonly database connection to self_now.db`);
        const dbPath = path.join(userData, 'self_now.db');
        db = new Database(dbPath, { readonly: true });

        console.log(`[${functionName}] - Fetching all existing word_ids from my_table.`);
        const rows = db.prepare("SELECT DISTINCT word_id FROM my_table").all();
        const existingWordIds = new Set(rows.map(row => row.word_id));
        console.log(`[${functionName}] - Found ${existingWordIds.size} existing word_ids in the database.`);

        console.log(`[${functionName}] - Processing input string.`);
        const words = inputString.split('|').filter(word => word.trim() !== '');
        console.log(`[${functionName}] - Split input into ${words.length} words: [${words.join(', ')}]`);

        if (words.length === 0) {
            console.log(`[${functionName}] - No valid words found. Returning "zero_word".`);
            return "zero_word";
        }

        if (!cache.compromise) {
            console.log(`[${functionName}] - Loading compromise module from userData.`);
            const compromisePath = path.join(userData, 'compromise.js');
            cache.compromise = require(compromisePath);
        }
        const compromise = cache.compromise;

        const validWords = [];
        const seenLemmas = new Set();

        for (const word of words) {
            const trimmedWord = word.trim().toLowerCase();
            console.log(`[${functionName}] - Processing word: '${trimmedWord}'`);

            if (!trimmedWord) {
                console.log(`[${functionName}] - Skipping empty word.`);
                continue;
            }

            let lemma = trimmedWord;
            try {
                const doc = compromise(trimmedWord); 
                let newLemma = lemma;
                if (doc.has('#Verb')) {
                    const infinitive = doc.verbs().toInfinitive().text().toLowerCase();
                    if (infinitive) newLemma = infinitive;
                } else if (doc.has('#Noun')) {
                    const singular = doc.nouns().toSingular().text().toLowerCase();
                    if (singular) newLemma = singular;
                }
                if (newLemma !== lemma) {
                    console.log(`[${functionName}] - Lemmatized '${trimmedWord}' to '${newLemma}'`);
                    lemma = newLemma;
                } else {
                    console.log(`[${functionName}] - No lemmatization needed for '${trimmedWord}'`);
                }
            } catch (e) {
                console.error(`[${functionName}] - Compromise lemmatization failed for '${trimmedWord}'. Using original.`, e);
            }

            if (seenLemmas.has(lemma)) {
                console.log(`[${functionName}] - Skipping already processed lemma: '${lemma}'`);
                continue;
            }

            console.log(`[${functionName}] - Validating lemma '${lemma}' against foundation.json.`);
            if (cache.wordToIdMap.has(lemma)) {
                const wordId = cache.wordToIdMap.get(lemma);
                console.log(`[${functionName}] - Lemma '${lemma}' is valid (ID: ${wordId}). Checking if it exists in DB.`);
                if (!existingWordIds.has(wordId)) {
                    console.log(`[${functionName}] - Word ID ${wordId} is novel. Adding '${lemma}' to sortable list.`);
                    seenLemmas.add(lemma);
                    validWords.push(lemma);
                } else {
                    console.log(`[${functionName}] - Word ID ${wordId} already exists in DB. Skipping.`);
                }
            } else {
                console.log(`[${functionName}] - Lemma '${lemma}' is NOT in foundation.json.`);
            }
        }

        console.log(`[${functionName}] - Sorting ${validWords.length} valid words by frequency (low frequency first).`);
        validWords.sort((a, b) => {
            const freqA = cache.wordToFrequency.get(a) || Infinity;
            const freqB = cache.wordToFrequency.get(b) || Infinity;
            return freqB - freqA;
        });
        console.log(`[${functionName}] - Sorted words: [${validWords.join(', ')}]`);

        const result = validWords.length > 0 ? validWords.join('|') + '|' : "zero_word";
        console.log(`[${functionName}] - Function finished. Returning: "${result}"`);
        return result;

    } catch (error) {
        console.error(`[${functionName}] - An error occurred:`, error);
        return "unknown_error";
    } finally {
        if (db) {
            console.log(`[${functionName}] - Closing database connection.`);
            db.close();
        }
    }
}

module.exports = {
    copyFilesToUserDataIfNotExist,
    getLocalUTCTimestamp,
    first_install,
    first_install_extension,
    view_number_of_tomorrow,
    number_of_self_now,
    rebuildReserveFolder,
    reset_book_db,
    clean_self_now,
    clean_twenty_thousand,
    bundle_config_2_1,
    reset_timezone,
    reset_app,
    insert_first_batch,
    today_once_box,
    set_ok_once,
    which_now_id,
    add_to_versatile,
    add_to_directly,
    add_to_backup,
    only_one_in_selfdb,
    backup_execute,
    getNextLetter,
    get_9_Letter,
    alphabet_day_reference,
    internal_first_round,
    internal_second_round,
    input_a_b_c_do,
    execute_back_button,
    show_back_button,
    del_word_id_self_now,
    getCount,
    which_now_box,
    make_past_appbox_today,
    is_today_greater_than_past,
    apply_long_short_status,
    fixorderIdsequence_selfdb,
    check_today_finish,
    utc_cut,
    calculateOffsetSeconds,
    getFixedTimezoneOffset,
    AdditionConvertSubtraction,
    convert_24h,
    two_convert_one,
    convertAdditionOffset,
    createTimeIntervals,
    init_appbox,
    check_prohibit_date,
    four_time,
    runFourTimeSession,
    check_3_day,
    what_two_offset_time,
    what_three_offset_time,
    add_to_self_dictionary_db,
    modify_to_self_dictionary_db,
    remove_to_self_dictionary_db,
    processWordsWithLemmatization,
    remove_content_inner_id_from_book,
    convey_self_dictionary_db,
    convey_self_now_db,
    convey_twenty_thousand_db,
    convey_config_json,
    verify_and_uncompress,
    four_compress,
    reserve_convey_self_dictionary_db,
    reserve_convey_self_now_db,
    reserve_convey_twenty_thousand_db,
    reserve_convey_config_json,
    all_sequence_Lemmatization_word,
    novel_sequence_Lemmatization_word,
    all_frequency_Lemmatization_word,
    novel_frequency_Lemmatization_word
};