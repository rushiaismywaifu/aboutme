# Rushia · About me

純 HTML、CSS 與 JavaScript 的個人首頁，直接適用於 GitHub Pages，不需要建置或安裝執行依賴。

## 本機預覽

```sh
python -m http.server 3000 --bind 0.0.0.0
```

開啟 `http://localhost:3000`。

## 測試

使用 Node.js 18 以上版本：

```sh
node --check main.js
node --test tests/main.test.cjs
```

測試涵蓋微光效果切換、儲存偏好、系統減少動態效果、儲存不可用與隱藏分頁時暫停動畫。

## 維護

- `index.html`：文案、連結與分享資訊。
- `style.css`：共用色彩變數、桌面／手機排版與動畫。
- `main.js`：可選的微光效果；即使停用 JavaScript，內容與連結仍可使用。
- `test.html`：原有的獨立開關示範頁，未修改。
- `assets/avatar.png`：原網站使用的頭像，改為本機載入。
- `assets/forest.webp`：AI 生成的森林蝴蝶插畫，已壓縮為 WebP。
- `assets/noto-tc-subset.woff2`：Noto Sans TC 的頁面文字子集，採 SIL Open Font License（見 `assets/OFL.txt`）。新增文字若未包含在子集中，會使用系統字型。

所有頁面資源使用相對路徑，無第三方字型請求。微光開關會記住偏好，並優先遵循作業系統的「減少動態效果」設定。
