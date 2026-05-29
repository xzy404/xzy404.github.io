// --- 全局状态管理 ---
const state = {
    currentTerm: "线段树 (Segment Tree)", // 本月词条
    currentMonthId: 3,                  // 本月期数ID
    // 模拟的初始硬编码数据（当没有配置令牌或仓库为空时加载）
    termsConfig: [
        { id: 1, term: "树状数组 (BIT)", isLocked: true },
        { id: 2, term: "最短路 (Dijkstra)", isLocked: true },
        { id: 3, term: "线段树 (Segment Tree)", isLocked: false }
    ],
    galleryData: [] // 存储从 GitHub API 实时获取的画作列表
};

// --- GitHub API 核心配置项 (优先读取本地缓存) ---
const githubConfig = {
    get owner() { return localStorage.getItem('gh_owner') || 'xzy404'; },
    get repo() { return localStorage.getItem('gh_repo') || 'xzy404.github.io'; },
    get token() { return localStorage.getItem('gh_token') || ''; }
};

// --- 路由初始化与监听 ---
function handleRoute() {
    const hash = window.location.hash || '#/';
    const main = document.getElementById('main-content');
    
    // 刷新导航高亮状态
    document.querySelectorAll('#sidebar nav a').forEach(a => a.classList.remove('bg-slate-800', 'text-white'));
    document.querySelectorAll('#sidebar nav a').forEach(a => a.classList.add('text-slate-400'));

    if (hash === '#/') {
        document.getElementById('nav-home').classList.add('bg-slate-800', 'text-white');
        renderCanvasPage(main, "🌌 公共画板 (首页)", "自由创作区，没有任何主题限制！", false);
    } else if (hash === '#/draw') {
        document.getElementById('nav-draw').classList.add('bg-slate-800', 'text-white');
        renderCanvasPage(main, `🎨 本期词条创作：${state.currentTerm}`, "用画笔诠释这个 OI 核心词条，博得最高票数吧！", true);
    } else if (hash.startsWith('#/show/')) {
        const termId = parseInt(hash.split('/')[2]);
        renderShowPage(main, termId);
    }
}

// --- 侧边栏“往期列表”渲染 ---
function renderSidebarTerms() {
    const container = document.getElementById('past-terms-list');
    container.innerHTML = state.termsConfig.map(t => `
        <a href="#/show/${t.id}" class="block px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition truncate">
            第 ${t.id} 期: ${t.term} ${t.isLocked ? '🔒' : '⚡'}
        </a>
    `).join('');
}

// --- 页面渲染：画布区域 (首页 & 创作区) ---
function renderCanvasPage(container, title, subtitle, showImageUpload) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto animate-fade-in">
            <h1 class="text-3xl font-extrabold text-slate-800">${title}</h1>
            <p class="text-slate-500 mt-2 mb-6">${subtitle}</p>
            
            <div class="bg-white p-4 rounded-2xl shadow-md border border-slate-200">
                <canvas id="paintCanvas" width="800" height="500" class="w-full bg-white border border-slate-100 rounded-xl shadow-inner"></canvas>
                
                <div class="mt-6 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div class="flex items-center space-x-6">
                        <div class="flex items-center space-x-2">
                            <label class="text-xs font-bold text-slate-600">粗细:</label>
                            <input type="range" id="brushSize" min="2" max="25" value="6" class="w-24 accent-teal-600">
                        </div>
                        <div class="flex items-center space-x-2">
                            <label class="text-xs font-bold text-slate-600">颜色:</label>
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
                        <button onclick="uploadToGitHub(${showImageUpload})" class="px-5 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:opacity-90 text-white text-xs font-bold rounded-lg shadow transition">
                            🚀 上传到 GitHub 仓库
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    initCanvasEngine();
}

// --- 核心画布引擎 ---
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
    const drawing = (e) => {
        if (!isDrawing) return;
        const p = getPos(e);
        ctx.lineWidth = document.getElementById('brushSize').value;
        ctx.strokeStyle = document.getElementById('brushColor').value;
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    };
    const stopDraw = () => isDrawing = false;

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', drawing);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', drawing, { passive: false });
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

// --- GitHub API 数据交互引擎 (方案 A 落地) ---
async function uploadToGitHub(isTermDrawing) {
    if (!githubConfig.token) {
        alert("⚠️ 请先点击左下角设置配置您的 GitHub Personal Access Token !");
        toggleConfigModal();
        return;
    }
    const author = prompt("请输入您的竞赛昵称/不记名代号：", "Anonymous_OIer");
    if (!author) return;

    const base64Data = canvas.toDataURL('image/png').split(',')[1];
    // 规定文件名： 票数_期数_作者_时间戳.png
    const termId = isTermDrawing ? state.currentMonthId : 0; // 0 代表首页公共画板
    const filename = `0_${termId}_${encodeURIComponent(author)}_${Date.now()}.png`;
    const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/submissions/${filename}`;

    try {
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Upload artwork for term ${termId} by ${author}`,
                content: base64Data
            })
        });
        if(res.ok) {
            alert("🎉 上传成功！画作已成功推送到您的 GitHub 仓库里。刷新展览区即可参与竞投！");
            if(isTermDrawing) window.location.hash = `#/show/${termId}`;
        } else {
            alert("❌ 上传失败，请检查您的 Token 权限是否包含 'repo' 或写内容权限。");
        }
    } catch (err) {
        console.error(err);
        alert("网络异常，无法连接到 GitHub API");
    }
}

// --- 页面渲染：展览区 与 投票处理 ---
async function renderShowPage(container, id) {
    const termObj = state.termsConfig.find(t => t.id === id);
    container.innerHTML = `<div class="text-center py-12 text-slate-500"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i><p>正在从 GitHub 仓库同步最新排名战况...</p></div>`;

    let artworks = [];
    
    // 如果配置了 Token，尝试从 GitHub 加载真实数据
    if (githubConfig.token) {
        try {
            const url = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/submissions`;
            const res = await fetch(url, { headers: { 'Authorization': `token ${githubConfig.token}` } });
            if (res.ok) {
                const files = await res.json();
                artworks = files.filter(f => f.name.endsWith('.png')).map(f => {
                    // 解析文件名: 票数_期数_作者_时间戳.png
                    const parts = f.name.replace('.png', '').split('_');
                    return {
                        filename: f.name,
                        sha: f.sha,
                        votes: parseInt(parts[0]) || 0,
                        termId: parseInt(parts[1]) || 0,
                        author: decodeURIComponent(parts[2] || '未知'),
                        img: f.download_url
                    };
                }).filter(art => art.termId === id);
            }
        } catch (e) { console.error("读取 GitHub 失败，启用本地 Mock 数据演示", e); }
    }

    // 回退模拟数据演示
    if (artworks.length === 0) {
        artworks = [
            { filename: '15_3_Alex_1.png', sha: '1', votes: 15, termId: 3, author: 'Tourist_Fan', img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23e2e8f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">【样例】线段树完美的区间划分</text></svg>' },
            { filename: '42_3_Bob_2.png', sha: '2', votes: 42, termId: 3, author: 'LazyTag_Master', img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23fee2e2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">【样例】堆式建树大作</text></svg>' },
            { filename: '8_3_Cyan_3.png', sha: '3', votes: 8, termId: 3, author: 'PushDown_Void', img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23dcfce7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">【样例】动态开点线段树</text></svg>' }
        ].filter(art => art.termId === id);
    }

    // 排序
    artworks.sort((a, b) => b.votes - a.votes);
    const topThree = artworks.slice(0, 3);
    const remaining = artworks.slice(3);

    // 渲染前三名（领奖台样式：2, 1, 3）
    let topHtml = '';
    const podium = [topThree[1], topThree[0], topThree[2]].filter(Boolean);
    podium.forEach(art => {
        const rank = artworks.indexOf(art) + 1;
        let borderClass = 'border-slate-200 h-44';
        let badge = `🥉 季军 (Rank 3)`;
        if(rank === 1) { borderClass = 'border-amber-400 scale-105 h-52 bg-amber-50/20'; badge = `🥇 冠军 (Rank 1)`; }
        if(rank === 2) { borderClass = 'border-slate-300 h-48'; badge = `🥈 亚军 (Rank 2)`; }

        topHtml += `
            <div class="flex-1 min-w-[260px] bg-white rounded-2xl shadow-md border-2 ${borderClass} flex flex-col justify-between overflow-hidden transition transform hover:-translate-y-1">
                <div class="p-2 bg-slate-50 border-b flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>${badge}</span>
                    <span class="text-slate-500">By: ${art.author}</span>
                </div>
                <div class="flex-1 p-2 flex items-center justify-center bg-white cursor-zoom-in overflow-hidden" onclick="zoomImage('${art.img}')">
                    <img src="${art.img}" class="max-h-full max-w-full object-contain rounded">
                </div>
                <div class="p-3 bg-slate-50 border-t flex items-center justify-between">
                    <span class="text-sm font-bold text-teal-600">${art.votes} 票</span>
                    <button onclick="castVote(${id}, '${art.filename}', '${art.sha}')" ${termObj.isLocked ? 'disabled' : ''} class="px-3 py-1.5 text-xs font-bold rounded-lg ${termObj.isLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700'} transition">
                        ${termObj.isLocked ? '已锁定' : '👍 投票'}
                    </button>
                </div>
            </div>
        `;
    });

    // 渲染常规榜单
    let listHtml = remaining.map((art, i) => `
        <div class="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow transition">
            <div class="flex items-center space-x-4">
                <span class="font-mono font-bold text-slate-400 text-md w-6">#${i + 4}</span>
                <div class="w-16 h-12 bg-slate-100 rounded border overflow-hidden flex items-center justify-center cursor-zoom-in" onclick="zoomImage('${art.img}')">
                    <img src="${art.img}" class="max-h-full max-w-full object-contain">
                </div>
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">作者: ${art.author}</h4>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <span class="font-bold text-slate-600 text-sm">${art.votes} 票</span>
                <button onclick="castVote(${id}, '${art.filename}', '${art.sha}')" ${termObj.isLocked ? 'disabled' : ''} class="px-4 py-1.5 text-xs font-semibold rounded-lg ${termObj.isLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-900'} transition">
                    投票
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="max-w-5xl mx-auto">
            <div class="mb-6">
                <h1 class="text-3xl font-extrabold text-slate-800">第 ${id} 期大佬展览：${termObj.term}</h1>
                <p class="text-slate-500 text-sm mt-1">状态：${termObj.isLocked ? '🔒 投票已截止并锁定排名' : '⚡ 正在火热投票中，画完即可上榜'}</p>
            </div>
            <div class="flex flex-wrap gap-6 items-end mb-10">${topHtml || '<p class="text-slate-400 italic">本期暂无作品提交</p>'}</div>
            <h3 class="text-lg font-bold text-slate-700 mb-4">📊 更多选手排名</h3>
            <div class="space-y-3">${listHtml || '<p class="text-slate-400 text-sm italic px-2">暂无更多次级排名</p>'}</div>
        </div>
    `;
}

// --- 核心投票：通过 API 重命名文件增加票数 ---
async function castVote(termId, filename, sha) {
    if (!githubConfig.token) {
        alert("⚠️ 投票需要配置您的 GitHub Token 以驱动数据重命名！");
        toggleConfigModal();
        return;
    }
    const parts = filename.replace('.png', '').split('_');
    const newVotes = parseInt(parts[0]) + 1;
    const newFilename = `${newVotes}_${parts[1]}_${parts[2]}_${parts[3]}.png`;

    // 1. 获取原文件内容进行转移
    try {
        const getUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/submissions/${filename}`;
        const getRes = await fetch(getUrl, { headers: { 'Authorization': `token ${githubConfig.token}` } });
        const fileData = await getRes.json();
        
        // 2. 写入新文件
        const putUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/submissions/${newFilename}`;
        const putRes = await fetch(putUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${githubConfig.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Vote up ${filename}`, content: fileData.content })
        });

        if(putRes.ok) {
            // 3. 删除旧文件
            await fetch(getUrl, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${githubConfig.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Remove old voted file`, sha: sha })
            });
            alert("🎉 投票成功！");
            renderShowPage(document.getElementById('main-content'), termId);
        }
    } catch(e) {
        alert("投票交互发生异常，请检查网络或 Token 权限。");
    }
}

// --- 辅助 UI 弹窗逻辑 ---
function zoomImage(src) {
    const lb = document.getElementById('lightbox');
    document.getElementById('lightbox-img').src = src;
    lb.classList.remove('hidden');
}
function closeLightbox() { document.getElementById('lightbox').classList.add('hidden'); }

function toggleConfigModal() { document.getElementById('config-modal').classList.toggle('hidden'); }
function saveConfig() {
    localStorage.setItem('gh_owner', document.getElementById('cfg-owner').value.trim());
    localStorage.setItem('gh_repo', document.getElementById('cfg-repo').value.trim());
    localStorage.setItem('gh_token', document.getElementById('cfg-token').value.trim());
    toggleConfigModal();
    alert("⚙️ 配置成功已存入浏览器环境！");
    handleRoute();
}

// 全局事件绑定
window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', () => {
    handleRoute();
    renderSidebarTerms();
});
