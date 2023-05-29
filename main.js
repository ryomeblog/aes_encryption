// 必要なモジュールを読み込む
const crypto = require('crypto');
const fs = require('fs').promises; // Promiseベースのファイル操作モジュール
const setting = require('./settings.json'); // 設定ファイルの読み込み

// テキストをAES暗号化する関数
function encrypt(text, key, iv) {
  // 暗号化用のCipherオブジェクトを作成
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  // テキストを暗号化
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  // 結果を16進数の文字列として返す
  return encrypted.toString('hex');
}

// テキストをAESで復号化する関数
function decrypt(text, key, iv) {
  // 16進数の文字列をバイナリデータに変換
  let encryptedText = Buffer.from(text, 'hex');
  // 復号化用のDecipherオブジェクトを作成
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  // テキストを復号化
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  // 復号化したテキストを返す
  return decrypted.toString();
}

// keyとivをファイルから読み込む非同期関数
async function getKeyAndIv() {
  try {
    // keyとivが保存されたファイルを読み込む
    let data = await fs.readFile('./key-iv.txt', 'utf8');
    // ファイルの内容を解析してkeyとivを取得
    let parts = data.split(',');
    let key = parts[0].split('=')[1];
    let iv = parts[1].split('=')[1];
    // keyとivをバイナリデータに変換して返す
    return { key: Buffer.from(key, 'hex'), iv: Buffer.from(iv, 'hex') };
  } catch (err) {
    console.log("Error reading key and iv:", err);
    return null;
  }
}

// ファイルを処理する非同期関数
async function processFile() {
  try {
    // ファイルを読み込む
    let data = await fs.readFile(setting.filePath, 'utf8');
    // 設定によってkeyとivを取得する方法を変える
    let { key, iv } = setting.encryption === 'decode' ? await getKeyAndIv() : { key: crypto.randomBytes(32), iv: crypto.randomBytes(16) };

    // 設定によって暗号化と復号化を行う
    if (setting.encryption === 'encode') {
      // テキストを暗号化
      let encrypted = encrypt(data, key, iv);
      // 結果をファイルに保存
      await fs.writeFile('./output.txt', encrypted);
      console.log("AES暗号化テキストをoutput.txtに出力する");

      // keyとivをファイルに保存
      await fs.writeFile('./key-iv.txt', `key=${key.toString('hex')},iv=${iv.toString('hex')}`);
      console.log("keyとivをkey-iv.txtに出力する");
    } else if (setting.encryption === 'decode') {
      // テキストを復号化
      let decrypted = decrypt(data, key, iv);
      // 結果をファイルに保存
      await fs.writeFile('./output.txt', decrypted);
      console.log("AES復号化テキストをoutput.txtに出力する");
    } else {
      console.log("Invalid encryption setting.");
    }
  } catch (err) {
    // エラー発生時はその詳細を出力
    console.log("Error: ", err);
  }
}

// processFile関数を実行してファイル処理を開始
processFile();
