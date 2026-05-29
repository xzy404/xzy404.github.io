// ==================== 🛠️ 请在此处配置您的 GITHUB 独立信息 ====================
const GITHUB_OWNER = "xzy404";                  // 您的 GitHub 账户名称
const GITHUB_REPO  = "xzy404.github.io";         // 您的 GitHub Pages 仓库名称
const GITHUB_TOKEN = "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"; 
// ============================================================================

// --- 全局状态管理 ---
const state = {
    currentTerm: "线段树 (Segment Tree)", // 当前月份进行的 OI 词条
    currentMonthId: 6,                  // 当前月期数 ID
    // 词条配置文件清单
    termsConfig: [
        { id: 1, term: "xzy", isLocked: true },
        { id: 2, term: "XPating", isLocked: true },
        { id: 3, term: "洛谷", isLocked: true },
        { id: 4, term: "CodeForces", isLocked: true },
        { id: 5, term: "AtCoder", isLocked: true },
        { id: 6, term: "线段树 (Segment Tree)", isLocked: false }
    ]
};

// --- 前端 Hash 路由分配系统 ---
function handleRoute() {
    const hash = window.location.hash || '#/';
    const main = document.getElementById('main-content');
    
    // 清洗侧边栏样式
    document.querySelectorAll('#sidebar nav a').forEach(a => {
        a.classList.remove('nav-active');
        a.classList.add('text-slate-400');
    });

    if (hash === '#/') {
        document.getElementById('nav-home').classList.add('nav-active');
        renderCanvasPage(main, "🌌 公共画板 (首页)", "自由创作娱乐区，画完即可保存至 GitHub，无主题限制！", false);
    } else if (hash === '#/draw') {
        document.getElementById('nav-draw').classList.add('nav-active');
        renderCanvasPage(main, `🎨 本期词条同步创作：${state.currentTerm}`, "发挥想象力，用画笔将这个硬核 OI 算法词条具象化吧！", true);
    } else if (hash.startsWith('#/show/')) {
        const termId = parseInt(hash.split('/')[2]);
        renderShowPage(main, termId);
    }
}

// --- 渲染侧边栏往期列表 ---
function renderSidebarTerms() {
    const container = document.getElementById('past-terms-list');
    container.innerHTML = state.termsConfig.map(t => `
        <a href="#/show/${t.id}" class="block px-2 py-1.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition truncate">
            第 ${t.id} 期: ${t.term} ${t.isLocked ? '🔒' : '⚡'}
        </a>
    `).join('');
}

// --- 视图层：构建画布页面骨架 ---
function renderCanvasPage(container, title, subtitle, showImageUpload) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto animate-fade-in">
            <h1 class="text-3xl font-extrabold text-slate-800">${title}</h1>
            <p class="text-slate-500 mt-2 mb-6 text-sm">${subtitle}</p>
            
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                <canvas id="paintCanvas" width="800" height="500" class="w-full bg-white border border-slate-100 rounded-xl shadow-inner block"></canvas>
                
                <div class="mt-6 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div class="flex items-center space-x-6">
                        <div class="flex items-center space-x-2">
                            <label class="text-xs font-bold text-slate-600">画笔粗细:</label>
                            <input type="range" id="brushSize" min="2" max="25" value="6" class="w-24 accent-teal-600">
                        </div>
                        <div class="flex items-center space-x-2">
                            <label class="text-xs font-bold text-slate-600">画笔颜色:</label>
                            <input type="color" id="brushColor" value="#0f172a" class="w-8 h-8 rounded-md cursor-pointer border-0 bg-transparent">
                        </div>
                        <button onclick="clearCanvas()" class="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">清空画布</button>
                    </div>

                    <div class="flex items-center space-x-2">
                        ${showImageUpload ? `
                        <label class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition">
                            📂 直接上传本地图片
                            <input type="file" id="fileUpload" accept="image/*" class="hidden" onchange="handleLocalImageUpload(event)">
                        </label>
                        ` : ''}
                        <button onclick="uploadToGitHub(${showImageUpload})" class="px-5 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90 text-white text-xs font-bold rounded-lg shadow-sm transition">
                            🚀 上传到 GitHub 仓库
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    initCanvasEngine();
}

// --- 核心画布双端（鼠标/触摸）绘图引擎 ---
let canvas, ctx, isDrawing = false;
function initCanvasEngine() {
    canvas = document.getElementById('paintCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDraw = (e) => { isDrawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
    const drawing = (e) => { if (!isDrawing) return; const p = getPos(e); ctx.lineWidth = document.getElementById('brushSize').value; ctx.strokeStyle = document.getElementById('brushColor').value; ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const stopDraw = () => isDrawing = false;

    // 适配 PC 端
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', drawing);
    canvas.addEventListener('mouseup', stopDraw);
    // 适配移动端/平板
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', drawing);
    canvas.addEventListener('touchend', stopDraw);
}

function clearCanvas() { if(confirm("确定要清空画布重新画吗？")) ctx.clearRect(0, 0, canvas.width, canvas.height); }

function handleLocalImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(f) {
        const img = new Image();
        img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); }
        img.src = f.target.result;
    }
    reader.readAsDataURL(file);
}

// --- 数据上报：将画作 Base64 推送到 GitHub Repo ---
async function uploadToGitHub(isTermDrawing) {
    if (!GITHUB_TOKEN || GITHUB_TOKEN.startsWith("github_pat_请在此替换")) {
        alert("❌ 上传中止：请先在 js/app.js 文件的第 4 行硬编码填入您的 GitHub 访问 Token 凭证！");
        return;
    }
    const author = prompt("请输入您的竞赛昵称/代号：", "Anonymous_OIer");
    if (!author) return;

    const base64Data = canvas.toDataURL('image/png').split(',')[1];
    const termId = isTermDrawing ? state.currentMonthId : 0; // 0期 代表公共画板
    // 命名约束：票数_期数_作者名_时间戳.png
    const filename = `0_${termId}_${encodeURIComponent(author)}_${Date.now()}.png`;
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/submissions/${filename}`;

    try {
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Gallery commit by ${author}`, content: base64Data })
        });
        if(res.ok) {
            alert("🎉 画作上传成功！已实时存入 GitHub 仓库中。");
            if(isTermDrawing) window.location.hash = `#/show/${termId}`;
        } else {
            alert("❌ 上传失败，请检查代码中硬编码的 Token 是否正确，并确认其拥有仓库写入权限。");
        }
    } catch (err) { alert("网络异常，无法成功连接到 GitHub API"); }
}

// --- 视图层：拉取 GitHub 文件列表，解析并渲染展览区 ---
async function renderShowPage(container, id) {
    const termObj = state.termsConfig.find(t => t.id === id);
    container.innerHTML = `<div class="text-center py-12 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><p class="text-xs">正在实时读取并整理 GitHub 仓库的战况排名表...</p></div>`;

    let artworks = [];
    const hasValidToken = GITHUB_TOKEN && !GITHUB_TOKEN.startsWith("github_pat_请在此替换");

    if (hasValidToken) {
        try {
            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/submissions`;
            const res = await fetch(url, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
            if (res.ok) {
                const files = await res.json();
                artworks = files.filter(f => f.name.endsWith('.png')).map(f => {
                    const parts = f.name.replace('.png', '').split('_');
                    return {
                        filename: f.name, sha: f.sha,
                        votes: parseInt(parts[0]) || 0,
                        termId: parseInt(parts[1]) || 0,
                        author: decodeURIComponent(parts[2] || '未知'),
                        img: f.download_url
                    };
                }).filter(art => art.termId === id);
            }
        } catch (e) { console.error("API 读取失败，转入备用模拟预览模式:", e); }
    }

    // 后备 Mock 样例数据（防止初始化阶段仓库为空时页面显得空旷）
    if (artworks.length === 0) {
        artworks = [
            { filename: '28_3_Alex_1.png', sha: 'm1', votes: 28, termId: 3, author: 'Tourist_Fan', img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8">【样例】区间懒标记大作</text></svg>' },
            { filename: '51_3_Bob_2.png', sha: 'm2', votes: 51, termId: 3, author: 'LazyTag_Master', img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8">【样例】满二叉树空间拆分</text></svg>' },
            { filename: '14_3_Cyan_3.png', sha: 'm3', votes: 14, termId: 3, author: 'PushDown_Void', img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8">【样例】动态开点线段树</text></svg>' }
        ].filter(art => art.termId === id);
    }

    // 按票数逆序排序
    artworks.sort((a, b) => b.votes - a.votes);
    const topThree = artworks.slice(0, 3);
    const remaining = artworks.slice(3);

    // 组装前三名经典领奖台布局 (2, 1, 3)
    let topHtml = '';
    const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);
    podiumOrder.forEach(art => {
        const rank = artworks.indexOf(art) + 1;
        let borderClass = 'border-slate-200 h-44';
        let badge = `🥉 季军 (Rank 3)`;
        if(rank === 1) { borderClass = 'border-amber-400 scale-105 h-52 bg-amber-50/20'; badge = `🥇 冠军 (Rank 1)`; }
        if(rank === 2) { borderClass = 'border-slate-300 h-48'; badge = `🥈 亚军 (Rank 2)`; }

        topHtml += `
            <div class="flex-1 min-w-[260px] bg-white rounded-2xl shadow-sm border-2 ${borderClass} flex flex-col justify-between overflow-hidden transition transform hover:-translate-y-1">
                <div class="p-2.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>${badge}</span>
                    <span class="text-slate-400">By: ${art.author}</span>
                </div>
                <div class="flex-1 p-2 flex items-center justify-center bg-white cursor-zoom-in overflow-hidden" onclick="zoomImage('${art.img}')">
                    <img src="${art.img}" class="max-h-full max-w-full object-contain rounded">
                </div>
                <div class="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-xs font-extrabold text-teal-600">${art.votes} 票</span>
                    <button onclick="castVote(${id}, '${art.filename}', '${art.sha}')" ${termObj.isLocked ? 'disabled' : ''} class="px-3 py-1.5 text-xs font-bold rounded-lg ${termObj.isLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700'} transition">
                        ${termObj.isLocked ? '已锁定' : '👍 投票'}
                    </button>
                </div>
            </div>
        `;
    });

    // 剩余选手链式列表排布
    let listHtml = remaining.map((art, i) => `
        <div class="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 hover:shadow-md transition">
            <div class="flex items-center space-x-4">
                <span class="font-mono font-bold text-slate-300 text-md w-6">#${i + 4}</span>
                <div class="w-16 h-12 bg-slate-50 rounded-lg border overflow-hidden flex items-center justify-center cursor-zoom-in" onclick="zoomImage('${art.img}')">
                    <img src="${art.img}" class="max-h-full max-w-full object-contain">
                </div>
                <h4 class="font-bold text-slate-700 text-sm">作者: ${art.author}</h4>
            </div>
            <div class="flex items-center space-x-4">
                <span class="font-bold text-slate-500 text-sm">${art.votes} 票</span>
                <button onclick="castVote(${id}, '${art.filename}', '${art.sha}')" ${termObj.isLocked ? 'disabled' : ''} class="px-4 py-1.5 text-xs font-bold rounded-lg ${termObj.isLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-900'} transition">
                    投票
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="max-w-5xl mx-auto">
            <div class="mb-6">
                <h1 class="text-3xl font-extrabold text-slate-800">第 ${id} 期大佬展览：${termObj.term}</h1>
                <p class="text-slate-400 text-xs mt-1">当前状态：${termObj.isLocked ? '🔒 展览期结束，锁定投票机制' : '⚡ 票选火热进行中'}</p>
            </div>
            <div class="flex flex-wrap gap-6 items-end mb-10">${topHtml || '<p class="text-slate-400 italic text-sm">本期暂无选手提交作品</p>'}</div>
            <h3 class="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">📊 更多选手排名</h3>
            <div class="space-y-3">${listHtml || '<p class="text-slate-400 text-xs italic px-2">暂无更多降序排名</p>'}</div>
        </div>
    `;
}

// --- 数据流重操纵：投票时利用 API 重命名文件实现票数 +1 ---
async function castVote(termId, filename, sha) {
    if (!GITHUB_TOKEN || GITHUB_TOKEN.startsWith("github_pat_请在此替换")) {
        alert("❌ 投票中止：请联系管理员先在后台填入有效的 Token 代码凭证。");
        return;
    }
    const parts = filename.replace('.png', '').split('_');
    const newVotes = parseInt(parts[0]) + 1;
    const newFilename = `${newVotes}_${parts[1]}_${parts[2]}_${parts[3]}.png`;

    try {
        const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/submissions/${filename}`;
        const getRes = await fetch(getUrl, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
        const fileData = await getRes.json();
        
        // 步骤一：创建全新加票后的新文件
        const putUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/submissions/${newFilename}`;
        const putRes = await fetch(putUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Vote up file to ${newVotes}`, content: fileData.content })
        });

        if(putRes.ok) {
            // 步骤二：抹除原子集旧文件
            await fetch(getUrl, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Delete outdated file`, sha: sha })
            });
            alert("🎉 投票上报成功！");
            renderShowPage(document.getElementById('main-content'), termId);
        }
    } catch(e) { alert("网络传输震荡，投票操作未成功同步至 GitHub 仓库。"); }
}

// --- 全局 LightBox 灯箱放大组件交互 ---
function zoomImage(src) { document.getElementById('lightbox-img').src = src; document.getElementById('lightbox').classList.remove('hidden'); }
function closeLightbox() { document.getElementById('lightbox').classList.add('hidden'); }

// --- 初始化生命周期挂载 ---
window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', () => { 
    handleRoute(); 
    renderSidebarTerms(); 
});
