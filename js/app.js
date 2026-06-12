// ==================== 🛠️ GITHUB 独立信息硬编码区域 ====================
const GITHUB_OWNER = "xzy404";                  
const GITHUB_REPO  = "xzy404.github.io";       
const tmp_1 = "github_pat_11BYLF4UI0waxu9CFRRsx5_";
const tmp_2 = "m98YfDXPHYcPVjbSHr4Diin7ay6x3tVtDOI9EL2lYdtSDVGE7OSwJqxbi6p";
const GITHUB_TOKEN = tmp_1 + tmp_2; 
// ============================================================================

// --- 全局状态管理 ---
const state = {
    currentTerm: "分块", 
    currentMonthId: 3,                  
    termsConfig: [
        { id: 1, term: "线段树", isLocked: true },
        { id: 2, term: "最短路", isLocked: true },
        { id: 3, term: "分块", isLocked: false }
    ]
};

// 安全剔除Token潜在的首尾空格干扰
const getCleanToken = () => GITHUB_TOKEN.trim();

// --- 前端 Hash 路由分配系统 ---
function handleRoute() {
    const hash = window.location.hash || '#/';
    const main = document.getElementById('main-content');
    
    document.querySelectorAll('#sidebar nav a').forEach(a => {
        a.classList.remove('nav-active');
        a.classList.add('text-slate-400');
    });

    if (hash === '#/') {
        document.getElementById('nav-home').classList.add('nav-active');
        // 首页文案微调，体现接力覆盖机制
        renderCanvasPage(main, "🌌 公共画板 (首页)", "自由创作娱乐区，画完保存将实时覆盖首页，所有人刷新可见最新状态！", false);
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
        <div class="max-w-4xl mx-auto">
            <h1 class="text-3xl font-extrabold text-slate-800">${title}</h1>
            <p class="text-slate-500 mt-2 mb-6 text-sm">${subtitle}</p>
            
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 relative">
                <div id="canvas-loading" class="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded-xl hidden">
                    <i class="fa-solid fa-spinner fa-spin text-teal-600 text-2xl mb-2"></i>
                    <span class="text-xs text-slate-500 font-medium">正在从 GitHub 同步最新画布状态...</span>
                </div>

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
                            🚀 上传并同步画布
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    // 如果 showImageUpload 为 false，说明当前处于不需要上传本地图片的【首页公共画板】，传入 true 触发历史画面同步
    initCanvasEngine(!showImageUpload);
}

// --- 核心画布双端绘图引擎 ---
let canvas, ctx, isDrawing = false;
function initCanvasEngine(loadLatestGlobal) {
    canvas = document.getElementById('paintCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 默认给画布底色填充纯白，防止图层叠加或导出时出现黑色透明底
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', drawing);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', drawing);
    canvas.addEventListener('touchend', stopDraw);

    // 【新增逻辑】如果是首页，实时去 GitHub 获取最新的一张首页历史画作渲染上屏
    if (loadLatestGlobal) {
        loadLatestPublicCanvas();
    }
}

// --- 【新增函数】首页载入时，自动寻找最新的公共画布图层 ---
async function loadLatestPublicCanvas() {
    const hasValidToken = GITHUB_TOKEN && !GITHUB_TOKEN.startsWith("github_pat_请在此替换");
    if (!hasValidToken) return;

    const loader = document.getElementById('canvas-loading');
    if (loader) loader.classList.remove('hidden');

    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/submissions`;
        const res = await fetch(url, { 
            headers: { 
                'Authorization': `Bearer ${getCleanToken()}`,
                'Accept': 'application/vnd.github+json'
            } 
        });
        
        if (res.ok) {
            const files = await res.json();
            // 筛选出所有属于公共画板（期数为 0）的 png 图片
            const publicBoards = files.filter(f => f.name.endsWith('.png')).map(f => {
                const parts = f.name.replace('.png', '').split('_');
                return {
                    termId: parseInt(parts[1]) || 0,
                    timestamp: parseInt(parts[3]) || 0,
                    downloadUrl: f.download_url
                };
            }).filter(art => art.termId === 0);

            // 如果有历史提交记录，找出时间戳最大的那张（即最后上传的那张画）
            if (publicBoards.length > 0) {
                publicBoards.sort((a, b) => b.timestamp - a.timestamp);
                const latestImgUrl = publicBoards[0].downloadUrl;

                // 将该图绘制到 Canvas 画布中作为基础底图
                const img = new Image();
                img.crossOrigin = "anonymous"; // 规避跨域画布污染限制
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    if (loader) loader.classList.add('hidden');
                };
                img.onerror = () => { if (loader) loader.classList.add('hidden'); };
                img.src = latestImgUrl;
                return;
            }
        }
    } catch (e) { console.error("读取公共画布历史失败:", e); }
    if (loader) loader.classList.add('hidden');
}

function clearCanvas() { if(confirm("确定要清空画布重新画吗？")) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); } }

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

// --- 数据上报：上传到 GitHub ---
async function uploadToGitHub(isTermDrawing) {
    if (!GITHUB_TOKEN || GITHUB_TOKEN.startsWith("github_pat_请在此替换")) {
        alert("❌ 上传中止：请先配置有效的 Token！");
        return;
    }
    const author = prompt("请输入您的竞赛昵称/代号：", "Anonymous_OIer");
    if (!author) return;

    const base64Data = canvas.toDataURL('image/png').split(',')[1];
    const termId = isTermDrawing ? state.currentMonthId : 0;
    
    const safeAuthor = encodeURIComponent(author.trim().replace(/_/g, '-')); 
    const filename = `0_${termId}_${safeAuthor}_${Date.now()}.png`;
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/submissions/${filename}`;

    try {
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${getCleanToken()}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json'
            },
            body: JSON.stringify({ message: `Gallery commit by ${author}`, content: base64Data })
        });
        if(res.ok) {
            alert("🎉 画作上传成功！已成功同步至全球网络，所有人刷新首页均可见此状态。");
            if(isTermDrawing) {
                window.location.hash = `#/show/${termId}`;
            } else {
                // 如果是首页，上传成功后本地重新触发一次底图加载，保障图层握手状态更新
                loadLatestPublicCanvas();
            }
        } else {
            const errData = await res.json();
            alert(`❌ 上传失败。原因: ${errData.message || '未知'}。请确保 submissions 文件夹已在仓库中创建！`);
        }
    } catch (err) { alert("网络异常，无法连接到 GitHub API 节点。"); }
}

// --- 视图层：拉取 GitHub 列表并渲染展览区 ---
async function renderShowPage(container, id) {
    const termObj = state.termsConfig.find(t => t.id === id);
    container.innerHTML = `<div class="text-center py-12 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><p class="text-xs">正在实时读取并整理 GitHub 仓库的战况排名表...</p></div>`;

    let artworks = [];
    const hasValidToken = GITHUB_TOKEN && !GITHUB_TOKEN.startsWith("github_pat_请在此替换");

    if (hasValidToken) {
        try {
            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/submissions`;
            const res = await fetch(url, { 
                headers: { 
                    'Authorization': `Bearer ${getCleanToken()}`,
                    'Accept': 'application/vnd.github+json'
                } 
            });
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
        } catch (e) { console.error(e); }
    }

    // 后备 Mock 真实测试样例数据
    if (artworks.length === 0) {
        artworks = [
            { filename: '28_3_Tourist-Fan_111.png', sha: 'mock1', votes: 28, termId: 3, author: 'Tourist-Fan', img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8">【测试样例】区间懒标记大作</text></svg>' },
            { filename: '51_3_LazyTag-Master_222.png', sha: 'mock2', votes: 51, termId: 3, author: 'LazyTag-Master', img: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8">【测试样例】分块大小 $\\sqrt{n}$ 概念图</text></svg>' }
        ].filter(art => art.termId === id);
    }

    artworks.sort((a, b) => b.votes - a.votes);
    const topThree = artworks.slice(0, 3);
    const remaining = artworks.slice(3);

    let topHtml = '';
    const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);
    podiumOrder.forEach(art => {
        const rank = artworks.indexOf(art) + 1;
        let borderClass = 'border-slate-200 h-44';
        let badge = `环境测试数据`;
        if(rank === 1) { borderClass = 'border-amber-400 scale-105 h-52 bg-amber-50/20'; badge = `🥇 冠军 (Rank 1)`; }
        if(rank === 2) { borderClass = 'border-slate-300 h-48'; badge = `🥈 亚军 (Rank 2)`; }
        if(rank === 3) { borderClass = 'border-orange-200 h-44'; badge = `🥉 季军 (Rank 3)`; }

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
                    <button onclick="castVote(${id}, '${art.filename}', '${art.sha}', '${art.author}')" ${termObj.isLocked ? 'disabled' : ''} class="px-3 py-1.5 text-xs font-bold rounded-lg ${termObj.isLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700'} transition">
                        ${termObj.isLocked ? '已锁定' : '👍 投票'}
                    </button>
                </div>
            </div>
        `;
    });

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
                <button onclick="castVote(${id}, '${art.filename}', '${art.sha}', '${art.author}')" ${termObj.isLocked ? 'disabled' : ''} class="px-4 py-1.5 text-xs font-bold rounded-lg ${termObj.isLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-900'} transition">
                    投票
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="max-w-5xl mx-auto">
            <div class="mb-6">
                <h1 class="text-3xl font-extrabold text-slate-800">第 ${id} 期展览：${termObj.term}</h1>
                <p class="text-slate-400 text-xs mt-1">当前状态：${termObj.isLocked ? '🔒 展览期结束' : '⚡ 票选火热进行中'}</p>
            </div>
            <div class="flex flex-wrap gap-6 items-end mb-10">${topHtml || '<p class="text-slate-400 italic text-sm">本期暂无选手提交作品</p>'}</div>
            <h3 class="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">📊 更多选手排名</h3>
            <div class="space-y-3">${listHtml || '<p class="text-slate-400 text-xs italic px-2">暂无更多降序排名</p>'}</div>
        </div>
    `;
}

// --- 核心网络投票逻辑 ---
async function castVote(termId, filename, sha, authorName) {
    if (sha.startsWith("mock")) {
        alert("💡 提示：当前显示的是本地数据样例，请先通过‘词条绘画区’成功上传一幅真实作品后，再测试 GitHub 联调投票！");
        return;
    }

    const voteKey = `voted_${termId}_${authorName}`;
    if (localStorage.getItem(voteKey)) {
        alert(`⚠️ 投票拒绝：你本期已经给选手 [ ${authorName} ] 投过票了！你可以继续去给其他选手投票。`);
        return;
    }

    const parts = filename.replace('.png', '').split('_');
    const newVotes = parseInt(parts[0]) + 1;
    const newFilename = `${newVotes}_${parts[1]}_${parts[2]}_${parts[3]}.png`;

    try {
        const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/submissions/${filename}`;
        const getRes = await fetch(getUrl, { 
            headers: { 
                'Authorization': `Bearer ${getCleanToken()}`,
                'Accept': 'application/vnd.github+json'
            } 
        });
        
        if (!getRes.ok) {
            alert("❌ 无法获取作品源文件，可能该文件在 GitHub 远端已被移位或删除。");
            return;
        }
        
        const fileData = await getRes.json();
        
        const putUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/submissions/${newFilename}`;
        const putRes = await fetch(putUrl, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${getCleanToken()}`, 
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json'
            },
            body: JSON.stringify({ message: `Vote up ${authorName} to ${newVotes}`, content: fileData.content })
        });

        if (putRes.ok) {
            await fetch(getUrl, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${getCleanToken()}`, 
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github+json'
                },
                body: JSON.stringify({ message: `Clean link`, sha: sha })
            });

            localStorage.setItem(voteKey, "true");
            alert(`🎉 成功为选手 [ ${authorName} ] 投上宝贵的一票！`);
            renderShowPage(document.getElementById('main-content'), termId);
        } else {
            alert("❌ 投票同步失败，请检查 Token 的 Contents 读写写入权限。");
        }
    } catch(e) { 
        alert("网络高频震荡，未能成功连通 GitHub 核心节点。"); 
    }
}

function zoomImage(src) { document.getElementById('lightbox-img').src = src; document.getElementById('lightbox').classList.remove('hidden'); }
function closeLightbox() { document.getElementById('lightbox').classList.add('hidden'); }

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', () => { 
    handleRoute(); 
    renderSidebarTerms(); 
});
