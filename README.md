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
node --check cursor.js
node --test tests/*.test.cjs
```

測試涵蓋微光效果切換、儲存偏好、系統減少動態效果、儲存不可用與隱藏分頁時暫停動畫。

## 維護

- `index.html`：文案、連結與分享資訊。
- `style.css`：共用色彩變數、桌面／手機排版與動畫。
- `cursor.js`：按需更新的滑鼠柔光與粒子拖尾。
- `main.js`：可選的微光效果；即使停用 JavaScript，內容與連結仍可使用。
- `test.html`：原有的獨立開關示範頁，未修改。
- `assets/avatar.png`：原網站使用的頭像，改為本機載入。
- `assets/forest.webp`：AI 生成的森林蝴蝶插畫，已壓縮為 WebP。
- `assets/noto-tc-subset.woff2`：Noto Sans TC 的頁面文字子集，採 SIL Open Font License（見 `assets/OFL.txt`）。新增文字若未包含在子集中，會使用系統字型。

所有頁面資源使用相對路徑，無第三方字型請求。微光開關會記住偏好，並優先遵循作業系統的「減少動態效果」設定。

## 滑鼠特效與效能

頁尾「微光效果」同時控制森林微光與滑鼠特效，保留原生游標與鍵盤操作。

- 只有支援精細滑鼠指標且未要求減少動態效果時才註冊移動監聽器；混合觸控裝置只回應滑鼠事件。
- 第一次移動時才建立 1 個柔光及 10 個可重複使用的粒子節點。
- 滑鼠事件合併至下一次畫面更新，只寫入最新座標；沒有持續執行的 JavaScript 動畫迴圈。
- 拖尾每隔至少 55ms、移動至少 10px 才產生一顆，500ms 後消失，僅動畫化 transform 與 opacity。
- 停止移動後不再排程更新；離開視窗、切換分頁、捲動、鍵盤 Tab 或關閉效果時，取消待處理更新及粒子動畫。
- 不使用全螢幕 Canvas、像素比縮放、混合模式或大型模糊濾鏡。

`tests/cursor.test.cjs` 另外驗證節點上限、事件合併、閒置時無 RAF、粒子節流與停用時清理行為。這些限制降低持續運算，不代表對所有裝置做過 CPU／電池耗用量測。
