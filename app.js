/* =============================================
   NOSSO BOLSO — APP ENGINE
   v2.0
   ============================================= */

(function () {
  'use strict';

  // ——————————————————————————————
  // HELPERS
  // ——————————————————————————————
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function getMonthYear(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  function getMonthKey(dateStr) {
    return dateStr.substring(0, 7); // YYYY-MM
  }

  // FIX: use local date instead of UTC to prevent timezone offset issues
  function todayStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ——————————————————————————————
  // DEFAULT CATEGORIES
  // ——————————————————————————————
  const DEFAULT_CATEGORIES = {
    income: [
      { name: 'Salário', emoji: '💼' },
      { name: 'Freelance', emoji: '💻' },
      { name: 'Investimentos', emoji: '📊' },
      { name: 'Vendas', emoji: '🛒' },
      { name: 'Outros (Receita)', emoji: '💡' }
    ],
    expense: [
      { name: 'Alimentação', emoji: '🍔' },
      { name: 'Moradia', emoji: '🏠' },
      { name: 'Transporte', emoji: '🚗' },
      { name: 'Saúde', emoji: '🏥' },
      { name: 'Educação', emoji: '📚' },
      { name: 'Lazer', emoji: '🎮' },
      { name: 'Roupas', emoji: '👕' },
      { name: 'Contas', emoji: '📄' },
      { name: 'Assinaturas', emoji: '📺' },
      { name: 'Outros (Despesa)', emoji: '📦' }
    ]
  };

  const categoryColors = {
    'Alimentação': '#FF6B6B', 'Moradia': '#4ECDC4', 'Transporte': '#45B7D1',
    'Saúde': '#96CEB4', 'Educação': '#FFEAA7', 'Lazer': '#DDA0DD',
    'Roupas': '#F0E68C', 'Contas': '#87CEEB', 'Assinaturas': '#FFB347',
    'Outros (Despesa)': '#C0C0C0', 'Salário': '#00FF88', 'Freelance': '#00CC6A',
    'Investimentos': '#44AAFF', 'Vendas': '#FFD644', 'Outros (Receita)': '#98FB98'
  };

  // Dynamic color generator for custom categories
  function getCategoryColor(name) {
    if (categoryColors[name]) return categoryColors[name];
    // Generate consistent color from name hash
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 65%, 55%)`;
  }

  // ——————————————————————————————
  // DATA STORE
  // ——————————————————————————————
  class IndexedDBStore {
    constructor(dbName, storeName) {
      this.dbName = dbName;
      this.storeName = storeName;
      this.db = null;
    }

    init() {
      return new Promise((resolve) => {
        if (!window.indexedDB) {
          console.warn('IndexedDB não suportado neste navegador. Usando localStorage.');
          resolve();
          return;
        }

        const request = indexedDB.open(this.dbName, 1);

        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };

        request.onsuccess = (e) => {
          this.db = e.target.result;
          resolve();
        };

        request.onerror = () => {
          console.warn('Falha ao abrir IndexedDB. Usando localStorage.');
          resolve();
        };
      });
    }

    get(key, defaultValue = null) {
      return new Promise((resolve) => {
        if (!this.db) {
          try {
            const data = localStorage.getItem(key);
            resolve(data ? JSON.parse(data) : defaultValue);
          } catch { resolve(defaultValue); }
          return;
        }

        try {
          const transaction = this.db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.get(key);

          request.onsuccess = () => {
            if (request.result !== undefined) {
              resolve(request.result);
            } else {
              // Migração do localStorage legado
              try {
                const localData = localStorage.getItem(key);
                if (localData) {
                  const parsed = JSON.parse(localData);
                  this.set(key, parsed);
                  resolve(parsed);
                } else {
                  resolve(defaultValue);
                }
              } catch { resolve(defaultValue); }
            }
          };

          request.onerror = () => {
            resolve(defaultValue);
          };
        } catch {
          resolve(defaultValue);
        }
      });
    }

    set(key, value) {
      return new Promise((resolve) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}

        if (!this.db) {
          resolve();
          return;
        }

        try {
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put(value, key);

          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
  }

  // ——————————————————————————————
  // TOAST
  // ——————————————————————————————
  function showToast(message, type = 'success') {
    const container = $('#toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || '✅'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ——————————————————————————————
  // ANIMATED COUNTER
  // ——————————————————————————————
  function animateValue(element, start, end, duration = 600) {
    const startTime = performance.now();
    const diff = end - start;
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      element.textContent = formatBRL(current);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ——————————————————————————————
  // INTERACTIVE BAR CHART (v2.0)
  // ——————————————————————————————
  class BarChart {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.data = [];
      this.barRects = [];
      this.hoverIndex = -1;
      this.hoverType = null; // 'income' or 'expense'
      this.animProgress = 0;
      this.tooltip = null;

      // Create tooltip element
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.className = 'chart-tooltip';
      this.canvas.parentElement.appendChild(this.tooltipEl);

      this._bindEvents();
    }

    _bindEvents() {
      this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
      this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
    }

    _onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found = false;
      for (const r of this.barRects) {
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
          this.hoverIndex = r.index;
          this.hoverType = r.type;
          found = true;

          // Show tooltip
          const d = this.data[r.index];
          const val = r.type === 'income' ? d.income : d.expense;
          const label = r.type === 'income' ? 'Receita' : 'Despesa';
          const color = r.type === 'income' ? '#00FF88' : '#FF4466';
          const diff = d.income - d.expense;
          const diffColor = diff >= 0 ? '#00FF88' : '#FF4466';

          this.tooltipEl.innerHTML = `
            <div class="tooltip-title">${d.label}</div>
            <div class="tooltip-row">
              <span class="tooltip-dot" style="background:#00FF88"></span>
              <span>Receita:</span>
              <strong style="color:#00FF88">${formatBRL(d.income)}</strong>
            </div>
            <div class="tooltip-row">
              <span class="tooltip-dot" style="background:#FF4466"></span>
              <span>Despesa:</span>
              <strong style="color:#FF4466">${formatBRL(d.expense)}</strong>
            </div>
            <div class="tooltip-divider"></div>
            <div class="tooltip-row">
              <span>Balanço:</span>
              <strong style="color:${diffColor}">${formatBRL(diff)}</strong>
            </div>
          `;
          this.tooltipEl.classList.add('visible');

          // Position tooltip
          let tx = e.clientX - rect.left + 16;
          let ty = e.clientY - rect.top - 10;
          const tw = this.tooltipEl.offsetWidth;
          const th = this.tooltipEl.offsetHeight;
          if (tx + tw > rect.width) tx = mx - tw - 16;
          if (ty + th > rect.height) ty = my - th - 10;
          if (ty < 0) ty = 10;
          this.tooltipEl.style.left = tx + 'px';
          this.tooltipEl.style.top = ty + 'px';

          break;
        }
      }

      if (!found) {
        this.hoverIndex = -1;
        this.hoverType = null;
        this.tooltipEl.classList.remove('visible');
      }

      this._drawFrame();
    }

    _onMouseLeave() {
      this.hoverIndex = -1;
      this.hoverType = null;
      this.tooltipEl.classList.remove('visible');
      this._drawFrame();
    }

    draw(data) {
      this.data = data;
      this.barRects = [];

      // Animate bars entrance
      this.animProgress = 0;
      const startTime = performance.now();
      const duration = 800;

      const animate = (now) => {
        const elapsed = now - startTime;
        this.animProgress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        this.animProgress = this.animProgress === 1 ? 1 : 1 - Math.pow(2, -10 * this.animProgress);
        this._drawFrame();
        if (elapsed < duration) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }

    _drawFrame() {
      const canvas = this.canvas;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = this.ctx;
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;
      const data = this.data;
      const anim = this.animProgress;

      ctx.clearRect(0, 0, W, H);

      if (!data.length) {
        ctx.fillStyle = '#6B6B8D';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados para exibir', W / 2, H / 2);
        return;
      }

      const padding = { top: 30, right: 20, bottom: 60, left: 75 };
      const chartW = W - padding.left - padding.right;
      const chartH = H - padding.top - padding.bottom;

      const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
      const niceMax = this._niceMax(maxVal);
      const groupW = chartW / data.length;
      const barW = Math.min(groupW * 0.28, 40);

      this.barRects = [];

      // Background gradient zone for chart area
      const bgGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      bgGrad.addColorStop(0, 'rgba(0,255,136,0.02)');
      bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(padding.left, padding.top, chartW, chartH);

      // Grid lines + Y labels
      const gridSteps = 5;
      for (let i = 0; i <= gridSteps; i++) {
        const y = padding.top + (chartH / gridSteps) * i;
        ctx.strokeStyle = 'rgba(45,45,63,0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(W - padding.right, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#6B6B8D';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const val = niceMax - (niceMax / gridSteps) * i;
        if (val >= 1000000) {
          ctx.fillText((val / 1000000).toFixed(1) + 'M', padding.left - 10, y);
        } else if (val >= 1000) {
          ctx.fillText((val / 1000).toFixed(1) + 'k', padding.left - 10, y);
        } else {
          ctx.fillText(val.toFixed(0), padding.left - 10, y);
        }
      }

      // Baseline
      ctx.strokeStyle = 'rgba(45,45,63,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartH);
      ctx.lineTo(W - padding.right, padding.top + chartH);
      ctx.stroke();

      // Bars
      data.forEach((d, i) => {
        const groupX = padding.left + groupW * i;
        const centerX = groupX + groupW / 2;
        const incX = centerX - barW - 2;
        const expX = centerX + 2;

        const isHoveredIncome = this.hoverIndex === i && this.hoverType === 'income';
        const isHoveredExpense = this.hoverIndex === i && this.hoverType === 'expense';
        const isGroupHovered = this.hoverIndex === i;
        const isDimmed = this.hoverIndex >= 0 && !isGroupHovered;

        // Highlight column background on hover
        if (isGroupHovered) {
          ctx.fillStyle = 'rgba(0,255,136,0.03)';
          ctx.fillRect(groupX, padding.top, groupW, chartH);
        }

        // Income bar
        const incH = (d.income / niceMax) * chartH * anim;
        const incY = padding.top + chartH - incH;
        const grdInc = ctx.createLinearGradient(0, incY, 0, incY + incH);
        if (isHoveredIncome) {
          grdInc.addColorStop(0, '#33FFaa');
          grdInc.addColorStop(1, '#00CC6A');
        } else {
          grdInc.addColorStop(0, '#00FF88');
          grdInc.addColorStop(1, '#00994F');
        }
        ctx.globalAlpha = isDimmed ? 0.35 : 1;
        ctx.fillStyle = grdInc;
        this._roundRect(ctx, incX, incY, barW, incH, 4);

        // Income glow on hover
        if (isHoveredIncome) {
          ctx.shadowColor = '#00FF88';
          ctx.shadowBlur = 15;
          ctx.fillStyle = grdInc;
          this._roundRect(ctx, incX, incY, barW, incH, 4);
          ctx.shadowBlur = 0;
        }

        this.barRects.push({ x: incX, y: incY, w: barW, h: incH, index: i, type: 'income' });

        // Value label on income bar
        if (d.income > 0 && anim >= 0.95) {
          ctx.fillStyle = isDimmed ? 'rgba(0,255,136,0.3)' : '#00FF88';
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const valText = d.income >= 1000 ? (d.income / 1000).toFixed(1) + 'k' : formatBRL(d.income);
          ctx.fillText(valText, incX + barW / 2, incY - 4);
        }

        // Expense bar
        const expH = (d.expense / niceMax) * chartH * anim;
        const expY = padding.top + chartH - expH;
        const grdExp = ctx.createLinearGradient(0, expY, 0, expY + expH);
        if (isHoveredExpense) {
          grdExp.addColorStop(0, '#FF6688');
          grdExp.addColorStop(1, '#EE3355');
        } else {
          grdExp.addColorStop(0, '#FF4466');
          grdExp.addColorStop(1, '#CC3652');
        }
        ctx.fillStyle = grdExp;
        this._roundRect(ctx, expX, expY, barW, expH, 4);

        // Expense glow on hover
        if (isHoveredExpense) {
          ctx.shadowColor = '#FF4466';
          ctx.shadowBlur = 15;
          ctx.fillStyle = grdExp;
          this._roundRect(ctx, expX, expY, barW, expH, 4);
          ctx.shadowBlur = 0;
        }

        this.barRects.push({ x: expX, y: expY, w: barW, h: expH, index: i, type: 'expense' });

        // Value label on expense bar
        if (d.expense > 0 && anim >= 0.95) {
          ctx.fillStyle = isDimmed ? 'rgba(255,68,102,0.3)' : '#FF4466';
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const valText = d.expense >= 1000 ? (d.expense / 1000).toFixed(1) + 'k' : formatBRL(d.expense);
          ctx.fillText(valText, expX + barW / 2, expY - 4);
        }

        ctx.globalAlpha = 1;

        // X label
        ctx.fillStyle = isGroupHovered ? '#E8E8F0' : '#6B6B8D';
        ctx.font = isGroupHovered ? 'bold 12px Inter, sans-serif' : '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(d.label, centerX, padding.top + chartH + 10);

        // Balance indicator below X label
        if (anim >= 0.95) {
          const bal = d.income - d.expense;
          if (d.income > 0 || d.expense > 0) {
            ctx.fillStyle = bal >= 0 ? 'rgba(0,255,136,0.6)' : 'rgba(255,68,102,0.6)';
            ctx.font = '9px Inter, sans-serif';
            ctx.fillText((bal >= 0 ? '+' : '') + (Math.abs(bal) >= 1000 ? (bal / 1000).toFixed(1) + 'k' : formatBRL(bal)), centerX, padding.top + chartH + 26);
          }
        }
      });

      // Legend
      const legendY = H - 10;
      ctx.globalAlpha = 1;

      // Income legend
      ctx.fillStyle = '#00FF88';
      this._roundRect(ctx, W / 2 - 100, legendY - 9, 12, 12, 3);
      ctx.fillStyle = '#B8B8D0';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Receitas', W / 2 - 84, legendY - 3);

      // Expense legend
      ctx.fillStyle = '#FF4466';
      this._roundRect(ctx, W / 2 + 10, legendY - 9, 12, 12, 3);
      ctx.fillStyle = '#B8B8D0';
      ctx.fillText('Despesas', W / 2 + 26, legendY - 3);
    }

    _niceMax(val) {
      if (val <= 0) return 100;
      const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
      const normalized = val / magnitude;
      let nice;
      if (normalized <= 1) nice = 1;
      else if (normalized <= 2) nice = 2;
      else if (normalized <= 5) nice = 5;
      else nice = 10;
      return nice * magnitude;
    }

    _roundRect(ctx, x, y, w, h, r) {
      if (h <= 0 || w <= 0) return;
      r = Math.min(r, h / 2, w / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ——————————————————————————————
  // INTERACTIVE PIE CHART (v2.0)
  // ——————————————————————————————
  class PieChart {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.data = [];
      this.slices = [];
      this.hoverIndex = -1;

      this.tooltipEl = document.createElement('div');
      this.tooltipEl.className = 'chart-tooltip';
      this.canvas.parentElement.appendChild(this.tooltipEl);

      this._bindEvents();
    }

    _bindEvents() {
      this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
      this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
    }

    _onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const W = rect.width;
      const H = rect.height;
      const cx = W / 2;
      const cy = H / 2 - 20;
      const radius = Math.min(W, H) / 2 - 50;

      const dx = mx - cx;
      const dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius * 0.55 || dist > radius) {
        this.hoverIndex = -1;
        this.tooltipEl.classList.remove('visible');
        this._drawFrame();
        return;
      }

      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;

      let found = false;
      for (const s of this.slices) {
        let a = angle;
        if (a < s.start && s.end > Math.PI) a += Math.PI * 2;
        if (a >= s.start && a < s.end) {
          this.hoverIndex = s.index;
          found = true;

          const d = this.data[s.index];
          const total = this.data.reduce((sum, dd) => sum + dd.value, 0);
          const pct = ((d.value / total) * 100).toFixed(1);

          this.tooltipEl.innerHTML = `
            <div class="tooltip-title">${d.label}</div>
            <div class="tooltip-row">
              <span class="tooltip-dot" style="background:${d.color}"></span>
              <span>Valor:</span>
              <strong style="color:${d.color}">${formatBRL(d.value)}</strong>
            </div>
            <div class="tooltip-row">
              <span>Proporção:</span>
              <strong>${pct}%</strong>
            </div>
          `;
          this.tooltipEl.classList.add('visible');

          let tx = e.clientX - rect.left + 16;
          let ty = e.clientY - rect.top - 10;
          if (tx + 180 > rect.width) tx = mx - 180 - 16;
          if (ty < 0) ty = 10;
          this.tooltipEl.style.left = tx + 'px';
          this.tooltipEl.style.top = ty + 'px';

          break;
        }
      }

      if (!found) {
        this.hoverIndex = -1;
        this.tooltipEl.classList.remove('visible');
      }

      this._drawFrame();
    }

    _onMouseLeave() {
      this.hoverIndex = -1;
      this.tooltipEl.classList.remove('visible');
      this._drawFrame();
    }

    draw(data) {
      this.data = data;
      this.slices = [];
      this._drawFrame();
    }

    _drawFrame() {
      const canvas = this.canvas;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = this.ctx;
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;
      const data = this.data;

      ctx.clearRect(0, 0, W, H);

      if (!data.length) {
        ctx.fillStyle = '#6B6B8D';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados', W / 2, H / 2);
        return;
      }

      const total = data.reduce((s, d) => s + d.value, 0);
      const cx = W / 2;
      const cy = H / 2 - 20;
      const radius = Math.min(W, H) / 2 - 50;
      let startAngle = -Math.PI / 2;

      this.slices = [];

      data.forEach((d, idx) => {
        const sliceAngle = (d.value / total) * 2 * Math.PI;
        const isHovered = this.hoverIndex === idx;
        const isDimmed = this.hoverIndex >= 0 && !isHovered;

        // Expand slice on hover
        const offset = isHovered ? 8 : 0;
        const midAngle = startAngle + sliceAngle / 2;
        const ox = Math.cos(midAngle) * offset;
        const oy = Math.sin(midAngle) * offset;

        ctx.globalAlpha = isDimmed ? 0.4 : 1;

        ctx.beginPath();
        ctx.moveTo(cx + ox, cy + oy);
        ctx.arc(cx + ox, cy + oy, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = d.color;
        ctx.fill();

        if (isHovered) {
          ctx.shadowColor = d.color;
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Label
        if (sliceAngle > 0.3) {
          const labelR = radius * 0.78;
          const lx = cx + ox + Math.cos(midAngle) * labelR;
          const ly = cy + oy + Math.sin(midAngle) * labelR;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const pct = ((d.value / total) * 100).toFixed(0) + '%';
          ctx.fillText(pct, lx, ly);
        }

        this.slices.push({ index: idx, start: startAngle, end: startAngle + sliceAngle });
        startAngle += sliceAngle;
      });

      ctx.globalAlpha = 1;

      // Inner circle (donut)
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#161618';
      ctx.fill();

      // Center text
      if (this.hoverIndex >= 0) {
        const hd = data[this.hoverIndex];
        ctx.fillStyle = hd.color;
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const name = hd.label.length > 14 ? hd.label.slice(0, 14) + '…' : hd.label;
        ctx.fillText(name, cx, cy - 10);
        ctx.fillStyle = '#E8E8F0';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText(formatBRL(hd.value), cx, cy + 10);
      } else {
        ctx.fillStyle = '#E8E8F0';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Despesas', cx, cy - 8);
        ctx.fillStyle = '#6B6B8D';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(formatBRL(total), cx, cy + 10);
      }

      // Legend
      let legendY = H - 30;
      const legendX = 10;
      const cols = Math.min(data.length, 3);
      const colW = W / cols;
      data.forEach((d, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = legendX + col * colW;
        const y = legendY + row * 16;
        const isH = this.hoverIndex === i;
        ctx.globalAlpha = (this.hoverIndex >= 0 && !isH) ? 0.4 : 1;
        ctx.fillStyle = d.color;
        ctx.fillRect(x, y - 5, 8, 8);
        ctx.fillStyle = isH ? '#E8E8F0' : '#B8B8D0';
        ctx.font = isH ? 'bold 10px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.textAlign = 'left';
        const label = d.label.length > 12 ? d.label.slice(0, 12) + '…' : d.label;
        ctx.fillText(label, x + 12, y + 2);
      });
      ctx.globalAlpha = 1;
    }
  }

  // ——————————————————————————————
  // MAIN APP
  // ——————————————————————————————
  class FinanceApp {
    constructor() {
      this.store = new IndexedDBStore('NeuroFinanceDB', 'store');

      this.transactions = [];
      this.goals = [];
      this.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
      this.notifications = [];
      this.dismissedNotifications = [];

      this.currentPage = 'dashboard';
      this.currentFilter = 'all';
      this.searchQuery = '';
      this.editingTxId = null;
      this.selectedMonth = todayStr().substring(0, 7); // YYYY-MM

      this.barChart = new BarChart('chart-bars');
      this.pieChart = new PieChart('chart-pie');

      this.init();
    }

    async init() {
      try {
        await this.store.init();
        this.transactions = await this.store.get('neuro_transactions', []);
        this.goals = await this.store.get('neuro_goals', []);
        this.categories = await this.store.get('neuro_categories', DEFAULT_CATEGORIES);
        this.dismissedNotifications = await this.store.get('neuro_dismissed_notifications', []);
      } catch (err) {
        console.error('Erro ao inicializar banco de dados, usando fallback:', err);
      }

      this.setDate();
      this.bindNavigation();
      this.bindMonthSelector();
      this.bindNotifications();
      this.bindLightbox();
      this.bindTransactionModal();
      this.bindGoalModal();
      this.bindContributeModal();
      this.bindFilters();
      this.bindExport();
      this.bindCategoryManager();
      this.rebuildCategorySelect();
      this.refresh();

      window.addEventListener('resize', () => this.drawCharts());
    }

    // ———— MONTH SELECTOR ————
    bindMonthSelector() {
      $('#btn-prev-month').addEventListener('click', () => this.changeMonth(-1));
      $('#btn-next-month').addEventListener('click', () => this.changeMonth(1));
    }

    changeMonth(direction) {
      const [year, month] = this.selectedMonth.split('-').map(Number);
      const d = new Date(year, month - 1 + direction, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      this.selectedMonth = `${y}-${m}`;
      this.refresh();
    }

    updateMonthLabel() {
      const [year, month] = this.selectedMonth.split('-').map(Number);
      const d = new Date(year, month - 1, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      $('#dashboard-month-label').textContent = label.charAt(0).toUpperCase() + label.slice(1);
    }

    // ———— NOTIFICATIONS ————
    bindNotifications() {
      const btn = $('#btn-notifications');
      const dropdown = $('#notifications-dropdown');
      const clearBtn = $('#btn-clear-notifications');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== btn) {
          dropdown.classList.remove('active');
        }
      });

      clearBtn.addEventListener('click', async () => {
        this.notifications.forEach(n => {
          if (!this.dismissedNotifications.includes(n.id)) {
            this.dismissedNotifications.push(n.id);
          }
        });
        await this.store.set('neuro_dismissed_notifications', this.dismissedNotifications);
        this.refreshNotificationsUI();
        showToast('Alertas limpos!', 'info');
      });
    }

    checkNotifications() {
      this.notifications = [];

      this.goals.forEach(g => {
        const pct = (g.current / g.target) * 100;
        if (g.current >= g.target) {
          this.notifications.push({
            id: `goal-completed-${g.id}`,
            icon: '🎉',
            message: `Meta concluída! Você atingiu o objetivo de ${formatBRL(g.target)} em "${g.name}".`
          });
        } else if (pct >= 80) {
          this.notifications.push({
            id: `goal-near-${g.id}`,
            icon: '🎯',
            message: `Quase lá! Sua meta "${g.name}" está ${pct.toFixed(0)}% concluída.`
          });
        }

        const daysLeft = Math.ceil((new Date(g.deadline + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24));
        if (g.current < g.target && daysLeft >= 0 && daysLeft <= 3) {
          this.notifications.push({
            id: `goal-deadline-${g.id}`,
            icon: '📅',
            message: `Prazo curto! Faltam apenas ${daysLeft} dias para o prazo da meta "${g.name}".`
          });
        }
      });

      const currentMonth = this.selectedMonth;
      const monthTx = this.transactions.filter(t => getMonthKey(t.date) === currentMonth);
      const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      if (monthIncome > 0) {
        const expenseRatio = (monthExpense / monthIncome) * 100;
        if (expenseRatio >= 85) {
          this.notifications.push({
            id: `ratio-high-${currentMonth}`,
            icon: '⚠️',
            message: `Aviso de Orçamento: Suas despesas do mês atingiram ${expenseRatio.toFixed(0)}% das suas receitas.`
          });
        }
      }

      this.refreshNotificationsUI();
    }

    refreshNotificationsUI() {
      const activeNotifications = this.notifications.filter(n => !this.dismissedNotifications.includes(n.id));
      const badge = $('#notifications-count');
      const list = $('#notifications-list');

      if (activeNotifications.length > 0) {
        badge.textContent = activeNotifications.length;
        badge.classList.add('active');
      } else {
        badge.classList.remove('active');
      }

      if (activeNotifications.length === 0) {
        list.innerHTML = '<div class="notifications-empty">Nenhum alerta pendente.</div>';
      } else {
        list.innerHTML = activeNotifications.map(n => `
          <div class="notifications-item">
            <div class="notification-icon-col">${n.icon}</div>
            <div class="notification-text-col">
              <div class="notification-msg">${n.message}</div>
            </div>
          </div>
        `).join('');
      }
    }

    // ———— LIGHTBOX FOR RECEIPTS ————
    bindLightbox() {
      const overlay = $('#lightbox-receipt');
      const img = $('#lightbox-img');
      const closeBtn = $('#lightbox-close');

      const openLightbox = (src) => {
        img.src = src;
        overlay.classList.add('active');
      };

      const closeLightbox = () => {
        overlay.classList.remove('active');
        setTimeout(() => { img.src = ''; }, 250);
      };

      closeBtn.addEventListener('click', closeLightbox);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });

      this._openLightbox = openLightbox;
    }

    // ———— CATEGORY MANAGEMENT ————
    getCategoryEmoji(name) {
      const all = [...this.categories.income, ...this.categories.expense];
      const found = all.find(c => c.name === name);
      return found ? found.emoji : '📁';
    }

    rebuildCategorySelect() {
      const select = $('#tx-category');
      const currentVal = select.value;
      select.innerHTML = '<option value="">Selecione...</option>';

      // Income group
      const incGroup = document.createElement('optgroup');
      incGroup.label = 'Receitas';
      this.categories.income.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = `${c.emoji} ${c.name}`;
        incGroup.appendChild(opt);
      });
      select.appendChild(incGroup);

      // Expense group
      const expGroup = document.createElement('optgroup');
      expGroup.label = 'Despesas';
      this.categories.expense.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = `${c.emoji} ${c.name}`;
        expGroup.appendChild(opt);
      });
      select.appendChild(expGroup);

      // Restore selection
      if (currentVal) select.value = currentVal;
    }

    bindCategoryManager() {
      const overlay = $('#modal-categories');
      const openBtn = $('#btn-manage-categories');
      const closeBtn = $('#modal-categories-close');
      const emojiInput = $('#cat-new-emoji');
      const emojiPicker = $('#cat-emoji-picker');

      const openModal = () => {
        overlay.classList.add('active');
        this.renderCategoryManager();
      };
      const closeModal = () => {
        overlay.classList.remove('active');
        emojiPicker.classList.remove('active');
      };

      openBtn.addEventListener('click', openModal);
      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

      // Emoji picker popover logic
      const emojis = [
        '💼', '💻', '📊', '🛒', '💡', '🍔', '🏠', '🚗', '🏥', '📚', '🎮', '👕', '📄', '📺', '📦',
        '💰', '💸', '💳', '📥', '📤', '🛡️', '🔑', '🎁', '✉️', '✏️', '🛠️', '🚲', '✈️', '🎨', '🏋️',
        '🍕', '🍿', '🐶', '🐱', '🌲', '🔥', '💈', '🧼', '🧹', '🏷️', '📁', '❤️', '🌟', '🎉', '🔔'
      ];

      emojiPicker.innerHTML = emojis.map(em => `
        <button type="button" class="emoji-picker-item" data-emoji="${em}">${em}</button>
      `).join('');

      emojiInput.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.classList.toggle('active');
      });

      emojiPicker.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('.emoji-picker-item');
        if (item) {
          emojiInput.value = item.dataset.emoji;
          emojiPicker.classList.remove('active');
        }
      });

      document.addEventListener('click', () => {
        emojiPicker.classList.remove('active');
      });

      // Add category form
      $('#form-add-category').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('#cat-new-name').value.trim();
        const emoji = emojiInput.value.trim() || '📁';
        const type = $('#cat-new-type').value;

        if (!name) return;

        // Check duplicate
        const exists = this.categories[type].some(c => c.name.toLowerCase() === name.toLowerCase());
        if (exists) {
          showToast('Categoria já existe!', 'error');
          return;
        }

        this.categories[type].push({ name, emoji });
        await this.store.set('neuro_categories', this.categories);
        this.rebuildCategorySelect();
        this.renderCategoryManager();
        $('#cat-new-name').value = '';
        emojiInput.value = '📁';
        showToast(`Categoria "${name}" adicionada!`, 'success');
      });

      // Search
      $('#cat-search').addEventListener('input', () => this.renderCategoryManager());
    }

    renderCategoryManager() {
      const query = ($('#cat-search')?.value || '').toLowerCase();
      const container = $('#categories-list');

      const renderGroup = (type, label) => {
        let cats = this.categories[type];
        if (query) {
          cats = cats.filter(c => c.name.toLowerCase().includes(query));
        }
        if (!cats.length) return '';

        return `
          <div class="cat-group-title">${label}</div>
          ${cats.map(c => `
            <div class="cat-item">
              <span class="cat-emoji">${c.emoji}</span>
              <span class="cat-name">${c.name}</span>
              <button class="action-btn delete delete-cat-btn" data-type="${type}" data-name="${c.name}" title="Excluir">🗑️</button>
            </div>
          `).join('')}
        `;
      };

      container.innerHTML = renderGroup('income', '📈 Receitas') + renderGroup('expense', '📉 Despesas');

      if (!container.innerHTML.trim()) {
        container.innerHTML = '<div class="empty-state"><p>Nenhuma categoria encontrada.</p></div>';
      }

      // Bind delete
      $$('.delete-cat-btn', container).forEach(btn => {
        btn.addEventListener('click', async () => {
          const { type, name } = btn.dataset;
          // Check if category is in use
          const inUse = this.transactions.some(t => t.category === name);
          const msg = inUse
            ? `A categoria "${name}" está sendo usada em transações. Deseja excluir mesmo assim?`
            : `Excluir categoria "${name}"?`;
          if (confirm(msg)) {
            this.categories[type] = this.categories[type].filter(c => c.name !== name);
            await this.store.set('neuro_categories', this.categories);
            this.rebuildCategorySelect();
            this.renderCategoryManager();
            showToast(`Categoria "${name}" removida!`, 'error');
          }
        });
      });
    }

    // ———— DATE ————
    setDate() {
      const now = new Date();
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      let dateStr = now.toLocaleDateString('pt-BR', options);
      dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      $('#topbar-date').textContent = dateStr;
    }

    // ———— NAVIGATION ————
    bindNavigation() {
      const navItems = $$('.nav-item');
      const pageTitles = {
        dashboard: ['Dashboard', 'Visão geral das suas finanças'],
        transactions: ['Transações', 'Gerencie receitas e despesas'],
        goals: ['Metas', 'Acompanhe seus objetivos financeiros'],
        reports: ['Relatórios', 'Análise detalhada das suas finanças']
      };

      navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const page = item.dataset.page;
          navItems.forEach(n => n.classList.remove('active'));
          item.classList.add('active');
          $$('.page-section').forEach(s => s.classList.remove('active'));
          $(`#page-${page}`).classList.add('active');
          const section = $(`#page-${page}`);
          section.style.animation = 'none';
          section.offsetHeight;
          section.style.animation = '';

          $('#topbar-title').textContent = pageTitles[page][0];
          $('#topbar-subtitle').textContent = pageTitles[page][1];
          this.currentPage = page;

          if (page === 'dashboard') this.drawCharts();
        });
      });

      $('#btn-see-all').addEventListener('click', () => {
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        $('#nav-transactions').classList.add('active');
        $$('.page-section').forEach(s => s.classList.remove('active'));
        $('#page-transactions').classList.add('active');
        $('#topbar-title').textContent = 'Transações';
        $('#topbar-subtitle').textContent = 'Gerencie receitas e despesas';
        this.currentPage = 'transactions';
      });
    }

    // ———— TRANSACTION MODAL ————
    bindTransactionModal() {
      const overlay = $('#modal-transaction');
      const form = $('#form-transaction');
      const fileInput = $('#tx-receipt');
      const triggerBtn = $('#btn-trigger-receipt');
      const filenameSpan = $('#receipt-filename');
      const previewDiv = $('#tx-receipt-preview');
      const previewImg = $('#img-preview');
      const removeBtn = $('#btn-remove-receipt');

      let tempReceiptBase64 = null;

      // Handle custom file button trigger
      triggerBtn.addEventListener('click', () => fileInput.click());

      // File input change logic
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
          showToast('O arquivo deve ser menor que 2MB!', 'error');
          fileInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          tempReceiptBase64 = reader.result;
          previewImg.src = reader.result;
          previewDiv.style.display = 'block';
          filenameSpan.textContent = file.name;
        };
        reader.onerror = () => {
          showToast('Erro ao ler a imagem!', 'error');
        };
        reader.readAsDataURL(file);
      });

      // Remove attachment action
      removeBtn.addEventListener('click', () => {
        fileInput.value = '';
        tempReceiptBase64 = null;
        previewDiv.style.display = 'none';
        previewImg.src = '';
        filenameSpan.textContent = 'Nenhum arquivo';
      });

      const openModal = (tx = null) => {
        this.editingTxId = tx ? tx.id : null;
        $('#modal-transaction-title').textContent = tx ? 'Editar Transação' : 'Nova Transação';
        this.rebuildCategorySelect();

        // Clear file input states
        fileInput.value = '';
        tempReceiptBase64 = null;
        previewDiv.style.display = 'none';
        previewImg.src = '';
        filenameSpan.textContent = 'Nenhum arquivo';

        if (tx) {
          $('#tx-id').value = tx.id;
          $('#tx-desc').value = tx.description;
          $('#tx-amount').value = tx.amount;
          $('#tx-date').value = tx.date;
          $('#tx-category').value = tx.category;
          $$('.type-toggle-btn').forEach(b => b.classList.remove('active'));
          $(`.type-toggle-btn[data-type="${tx.type}"]`).classList.add('active');

          // Load receipt if present
          if (tx.receipt) {
            tempReceiptBase64 = tx.receipt;
            previewImg.src = tx.receipt;
            previewDiv.style.display = 'block';
            filenameSpan.textContent = 'Comprovante anexo';
          }
        } else {
          form.reset();
          $('#tx-date').value = todayStr();
          $$('.type-toggle-btn').forEach(b => b.classList.remove('active'));
          $('.type-toggle-btn[data-type="income"]').classList.add('active');
        }

        overlay.classList.add('active');
      };

      const closeModal = () => {
        overlay.classList.remove('active');
        form.reset();
        fileInput.value = '';
        tempReceiptBase64 = null;
        previewDiv.style.display = 'none';
        previewImg.src = '';
        filenameSpan.textContent = 'Nenhum arquivo';
        this.editingTxId = null;
      };

      $('#btn-add-transaction').addEventListener('click', () => openModal());
      $('#modal-transaction-close').addEventListener('click', closeModal);
      $('#btn-cancel-tx').addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

      $$('.type-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          $$('.type-toggle-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = $('.type-toggle-btn.active').dataset.type;
        const tx = {
          id: this.editingTxId || genId(),
          type,
          description: $('#tx-desc').value.trim(),
          amount: parseFloat($('#tx-amount').value),
          date: $('#tx-date').value,
          category: $('#tx-category').value,
          receipt: tempReceiptBase64,
          createdAt: new Date().toISOString()
        };

        if (this.editingTxId) {
          const idx = this.transactions.findIndex(t => t.id === this.editingTxId);
          if (idx >= 0) this.transactions[idx] = tx;
          showToast('Transação atualizada!', 'success');
        } else {
          this.transactions.push(tx);
          showToast('Transação adicionada!', 'success');
        }

        await this.store.set('neuro_transactions', this.transactions);
        closeModal();
        this.refresh();
      });

      this._openTxModal = openModal;
    }

    // ———— GOAL MODAL ————
    bindGoalModal() {
      const overlay = $('#modal-goal');
      const form = $('#form-goal');

      const openModal = () => {
        form.reset();
        overlay.classList.add('active');
      };

      const closeModal = () => {
        overlay.classList.remove('active');
        form.reset();
      };

      $('#btn-add-goal').addEventListener('click', openModal);
      $('#modal-goal-close').addEventListener('click', closeModal);
      $('#btn-cancel-goal').addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const goal = {
          id: genId(),
          name: $('#goal-name').value.trim(),
          target: parseFloat($('#goal-target').value),
          current: parseFloat($('#goal-initial').value) || 0,
          deadline: $('#goal-deadline').value,
          createdAt: new Date().toISOString()
        };
        this.goals.push(goal);
        await this.store.set('neuro_goals', this.goals);
        closeModal();
        this.renderGoals();
        showToast('Meta criada com sucesso!', 'success');
      });
    }

    // ———— CONTRIBUTE MODAL ————
    bindContributeModal() {
      const overlay = $('#modal-contribute');
      const form = $('#form-contribute');

      const closeModal = () => {
        overlay.classList.remove('active');
        form.reset();
      };

      $('#modal-contribute-close').addEventListener('click', closeModal);
      $('#btn-cancel-contribute').addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const goalId = $('#contribute-goal-id').value;
        const amount = parseFloat($('#contribute-amount').value);
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
          goal.current = Math.min(goal.current + amount, goal.target * 2);
          await this.store.set('neuro_goals', this.goals);
          closeModal();
          this.renderGoals();
          if (goal.current >= goal.target) {
            showToast(`🎉 Meta "${goal.name}" alcançada!`, 'success');
          } else {
            showToast('Contribuição registrada!', 'success');
          }
        }
      });

      this._openContributeModal = (goal) => {
        $('#contribute-goal-id').value = goal.id;
        $('#contribute-goal-name').textContent = `Meta: ${goal.name} — Faltam ${formatBRL(goal.target - goal.current)}`;
        form.reset();
        $('#contribute-goal-id').value = goal.id;
        overlay.classList.add('active');
      };
    }

    // ———— FILTERS ————
    bindFilters() {
      $$('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          $$('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentFilter = btn.dataset.filter;
          this.renderTransactionsTable();
        });
      });

      $('#search-transactions').addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderTransactionsTable();
      });
    }

    // ———— EXPORT ————
    bindExport() {
      // JSON export
      $('#btn-export').addEventListener('click', () => {
        const data = {
          transactions: this.transactions,
          goals: this.goals,
          categories: this.categories,
          exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nosso-bolso-${todayStr()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Dados exportados em JSON!', 'info');
      });

      // PDF export (print)
      $('#btn-export-pdf').addEventListener('click', () => {
        this._generatePrintReport();
      });
    }

    _generatePrintReport() {
      const totalIncome = this.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = this.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance = totalIncome - totalExpense;

      // Monthly breakdown
      const months = {};
      this.transactions.forEach(tx => {
        const key = getMonthKey(tx.date);
        if (!months[key]) months[key] = { income: 0, expense: 0 };
        months[key][tx.type] += tx.amount;
      });
      const sortedMonths = Object.keys(months).sort().reverse();

      // Category breakdown (expenses)
      const catExpense = {};
      this.transactions.filter(t => t.type === 'expense').forEach(tx => {
        catExpense[tx.category] = (catExpense[tx.category] || 0) + tx.amount;
      });
      const sortedCats = Object.entries(catExpense).sort((a, b) => b[1] - a[1]);

      // Build print HTML
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Financeiro — ${todayStr()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a1a; padding: 40px; font-size: 13px; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #00CC6A; padding-bottom: 20px; }
    .header h1 { font-size: 24px; color: #0A0A0A; margin-bottom: 4px; }
    .header p { color: #666; font-size: 12px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .summary-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; text-align: center; }
    .summary-card .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .summary-card .value { font-size: 22px; font-weight: 800; }
    .summary-card .value.green { color: #00994F; }
    .summary-card .value.red { color: #CC3652; }
    h2 { font-size: 16px; margin-bottom: 12px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 12px; }
    th { background: #f5f5f5; padding: 10px 12px; text-align: left; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; color: #666; border-bottom: 2px solid #ddd; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .green { color: #00994F; }
    .red { color: #CC3652; }
    .bold { font-weight: 700; }
    .footer { text-align: center; color: #999; font-size: 10px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 16px; }
    .section { margin-bottom: 32px; }
    .goals-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
    .goal-item { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px; }
    .goal-item .goal-name { font-weight: 700; font-size: 14px; }
    .goal-item .goal-detail { color: #666; font-size: 12px; margin-top: 4px; }
    .goal-bar-bg { height: 8px; background: #e0e0e0; border-radius: 4px; margin-top: 8px; }
    .goal-bar-fill { height: 100%; background: #00994F; border-radius: 4px; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>👛 Relatório Nosso Bolso</h1>
    <p>Nosso Bolso — Gerado em ${formatDate(todayStr())}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Total de Receitas</div>
      <div class="value green">${formatBRL(totalIncome)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total de Despesas</div>
      <div class="value red">${formatBRL(totalExpense)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Balanço Geral</div>
      <div class="value ${balance >= 0 ? 'green' : 'red'}">${formatBRL(balance)}</div>
    </div>
  </div>

  <div class="section">
    <h2>📊 Resumo Mensal</h2>
    <table>
      <thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Balanço</th></tr></thead>
      <tbody>
        ${sortedMonths.map(key => {
          const m = months[key];
          const bal = m.income - m.expense;
          return `<tr>
            <td class="bold" style="text-transform:capitalize">${getMonthYear(key + '-01')}</td>
            <td class="green">${formatBRL(m.income)}</td>
            <td class="red">${formatBRL(m.expense)}</td>
            <td class="bold ${bal >= 0 ? 'green' : 'red'}">${formatBRL(bal)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  ${sortedCats.length ? `
  <div class="section">
    <h2>📉 Despesas por Categoria</h2>
    <table>
      <thead><tr><th>Categoria</th><th>Total</th><th>% do Total</th></tr></thead>
      <tbody>
        ${sortedCats.map(([cat, val]) => `<tr>
          <td>${this.getCategoryEmoji(cat)} ${cat}</td>
          <td class="red bold">${formatBRL(val)}</td>
          <td>${((val / totalExpense) * 100).toFixed(1)}%</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${this.goals.length ? `
  <div class="section">
    <h2>🎯 Metas Financeiras</h2>
    <div class="goals-list">
      ${this.goals.map(g => {
        const pct = Math.min((g.current / g.target) * 100, 100);
        return `<div class="goal-item">
          <div class="goal-name">${g.name}</div>
          <div class="goal-detail">${formatBRL(g.current)} de ${formatBRL(g.target)} (${pct.toFixed(1)}%) — Prazo: ${formatDate(g.deadline)}</div>
          <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
      }).join('')}
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2>📋 Todas as Transações</h2>
    <table>
      <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
      <tbody>
        ${[...this.transactions].sort((a, b) => b.date.localeCompare(a.date)).map(tx => `<tr>
          <td>${formatDate(tx.date)}</td>
          <td>${tx.type === 'income' ? '📈 Receita' : '📉 Despesa'}</td>
          <td>${tx.description}</td>
          <td>${this.getCategoryEmoji(tx.category)} ${tx.category}</td>
          <td class="bold ${tx.type === 'income' ? 'green' : 'red'}">${tx.type === 'income' ? '+' : '-'} ${formatBRL(tx.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Nosso Bolso v2.0 — Relatório gerado automaticamente</p>
  </div>
</body>
</html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
      showToast('Relatório PDF aberto para impressão!', 'info');
    }

    // ———— REFRESH ALL ————
    refresh() {
      this.updateMonthLabel();
      this.renderStats();
      this.renderRecentTransactions();
      this.renderTransactionsTable();
      this.renderGoals();
      this.renderReports();
      this.drawCharts();
      this.checkNotifications();
    }

    // ———— STATS ————
    renderStats() {
      const currentMonth = this.selectedMonth;

      const monthTx = this.transactions.filter(t => getMonthKey(t.date) === currentMonth);
      const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const totalIncome = this.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = this.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance = totalIncome - totalExpense;
      const savings = monthIncome - monthExpense;

      // Animate balance (Global)
      const balEl = $('#stat-balance');
      const prevBalance = parseFloat(balEl.dataset.value || '0');
      balEl.dataset.value = balance;
      animateValue(balEl, prevBalance, balance);
      balEl.className = `stat-value ${balance >= 0 ? 'positive' : 'negative'}`;

      // Animate Total Income (Global)
      const totIncEl = $('#stat-total-income');
      const prevTotInc = parseFloat(totIncEl.dataset.value || '0');
      totIncEl.dataset.value = totalIncome;
      animateValue(totIncEl, prevTotInc, totalIncome);

      // Animate Total Expense (Global)
      const totExpEl = $('#stat-total-expense');
      const prevTotExp = parseFloat(totExpEl.dataset.value || '0');
      totExpEl.dataset.value = totalExpense;
      animateValue(totExpEl, prevTotExp, totalExpense);

      // Animate Income (Month)
      const incEl = $('#stat-income');
      const prevInc = parseFloat(incEl.dataset.value || '0');
      incEl.dataset.value = monthIncome;
      animateValue(incEl, prevInc, monthIncome);

      // Animate Expense (Month)
      const expEl = $('#stat-expense');
      const prevExp = parseFloat(expEl.dataset.value || '0');
      expEl.dataset.value = monthExpense;
      animateValue(expEl, prevExp, monthExpense);

      // Animate Savings (Month)
      const savEl = $('#stat-savings');
      const prevSav = parseFloat(savEl.dataset.value || '0');
      savEl.dataset.value = savings;
      animateValue(savEl, prevSav, savings);
      savEl.className = `stat-value ${savings >= 0 ? 'positive' : 'negative'}`;

      const incomeCount = monthTx.filter(t => t.type === 'income').length;
      const expenseCount = monthTx.filter(t => t.type === 'expense').length;
      $('#stat-income-count').textContent = `${incomeCount} entrada${incomeCount !== 1 ? 's' : ''}`;
      $('#stat-expense-count').textContent = `${expenseCount} saída${expenseCount !== 1 ? 's' : ''}`;

      const savPct = monthIncome > 0 ? ((savings / monthIncome) * 100).toFixed(1) : '0';
      $('#stat-savings-pct').textContent = `${savPct}% da receita`;
    }

    // ———— RECENT TRANSACTIONS ————
    renderRecentTransactions() {
      const container = $('#recent-list');
      const sorted = [...this.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      const recent = sorted.slice(0, 5);

      if (!recent.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>Nenhuma transação registrada ainda.<br>Clique em "Nova Transação" para começar!</p>
          </div>`;
        return;
      }

      container.innerHTML = recent.map(tx => `
        <div class="transaction-item">
          <div class="transaction-icon-wrapper ${tx.type}">
            ${this.getCategoryEmoji(tx.category)}
          </div>
          <div class="transaction-details">
            <div class="transaction-desc" style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
              <span>${tx.description}</span>
              ${tx.receipt ? `<span class="receipt-badge view-receipt-btn" data-id="${tx.id}">📷 Recibo</span>` : ''}
            </div>
            <div class="transaction-cat">${tx.category}</div>
          </div>
          <div class="transaction-amount ${tx.type}">
            ${tx.type === 'income' ? '+' : '-'} ${formatBRL(tx.amount)}
          </div>
          <div class="transaction-date">${formatDateShort(tx.date)}</div>
        </div>
      `).join('');

      // Bind click view receipt
      $$('.view-receipt-btn', container).forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const tx = this.transactions.find(t => t.id === btn.dataset.id);
          if (tx && tx.receipt) this._openLightbox(tx.receipt);
        });
      });
    }

    // ———— TRANSACTIONS TABLE ————
    renderTransactionsTable() {
      const tbody = $('#transactions-tbody');
      let filtered = [...this.transactions];

      if (this.currentFilter !== 'all') {
        filtered = filtered.filter(t => t.type === this.currentFilter);
      }

      if (this.searchQuery) {
        filtered = filtered.filter(t =>
          t.description.toLowerCase().includes(this.searchQuery) ||
          t.category.toLowerCase().includes(this.searchQuery)
        );
      }

      filtered.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

      if (!filtered.length) {
        tbody.innerHTML = `
          <tr><td colspan="6">
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <p>Nenhuma transação encontrada.</p>
            </div>
          </td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(tx => `
        <tr data-id="${tx.id}">
          <td><span class="type-badge ${tx.type}">${tx.type === 'income' ? '📈 Receita' : '📉 Despesa'}</span></td>
          <td style="display:flex; align-items:center; gap:var(--space-xs); border-bottom:none; min-height:48px;">
            <span>${tx.description}</span>
            ${tx.receipt ? `<span class="receipt-badge view-receipt-btn" data-id="${tx.id}">📷 Recibo</span>` : ''}
          </td>
          <td>${this.getCategoryEmoji(tx.category)} ${tx.category}</td>
          <td style="color:${tx.type === 'income' ? 'var(--neuro-green)' : 'var(--neuro-red)'};font-weight:700;">
            ${tx.type === 'income' ? '+' : '-'} ${formatBRL(tx.amount)}
          </td>
          <td style="color:var(--neuro-text-muted)">${formatDate(tx.date)}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn edit-tx" data-id="${tx.id}" title="Editar">✏️</button>
              <button class="action-btn delete delete-tx" data-id="${tx.id}" title="Excluir">🗑️</button>
            </div>
          </td>
        </tr>
      `).join('');

      // Bind click view receipt
      $$('.view-receipt-btn', tbody).forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const tx = this.transactions.find(t => t.id === btn.dataset.id);
          if (tx && tx.receipt) this._openLightbox(tx.receipt);
        });
      });

      $$('.edit-tx', tbody).forEach(btn => {
        btn.addEventListener('click', () => {
          const tx = this.transactions.find(t => t.id === btn.dataset.id);
          if (tx) this._openTxModal(tx);
        });
      });

      $$('.delete-tx', tbody).forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Tem certeza que deseja excluir esta transação?')) {
            this.transactions = this.transactions.filter(t => t.id !== btn.dataset.id);
            await this.store.set('neuro_transactions', this.transactions);
            this.refresh();
            showToast('Transação excluída!', 'error');
          }
        });
      });
    }

    // ———— GOALS ————
    renderGoals() {
      const container = $('#goals-grid');
      if (!this.goals.length) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <div class="empty-icon">🎯</div>
            <p>Nenhuma meta criada ainda.<br>Crie metas para acompanhar seu progresso!</p>
          </div>`;
        return;
      }

      const today = todayStr();
      container.innerHTML = this.goals.map(goal => {
        const pct = Math.min((goal.current / goal.target) * 100, 100);
        const isCompleted = goal.current >= goal.target;
        const isExpired = !isCompleted && goal.deadline < today;
        let statusClass = 'active';
        let statusLabel = 'Em andamento';
        if (isCompleted) { statusClass = 'completed'; statusLabel = 'Concluída'; }
        else if (isExpired) { statusClass = 'expired'; statusLabel = 'Expirada'; }

        return `
          <div class="goal-card ${isCompleted ? 'completed' : ''}">
            <div class="goal-header">
              <div class="goal-title">${goal.name}</div>
              <span class="goal-status ${statusClass}">${statusLabel}</span>
            </div>
            <div class="goal-amounts">
              <span class="goal-current">${formatBRL(goal.current)}</span>
              <span class="goal-target">de ${formatBRL(goal.target)}</span>
            </div>
            <div class="goal-progress-bar">
              <div class="goal-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="goal-footer">
              <span class="goal-deadline">📅 ${formatDate(goal.deadline)}</span>
              <span class="goal-percent">${pct.toFixed(1)}%</span>
            </div>
            ${!isCompleted ? `
              <button class="goal-contribute-btn contribute-btn" data-id="${goal.id}">+ Contribuir</button>
            ` : ''}
            <button class="goal-contribute-btn delete-goal-btn" data-id="${goal.id}" style="margin-top:var(--space-sm);color:var(--neuro-red-dim);">🗑️ Remover Meta</button>
          </div>
        `;
      }).join('');

      $$('.contribute-btn', container).forEach(btn => {
        btn.addEventListener('click', () => {
          const goal = this.goals.find(g => g.id === btn.dataset.id);
          if (goal) this._openContributeModal(goal);
        });
      });

      $$('.delete-goal-btn', container).forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Tem certeza que deseja remover esta meta?')) {
            this.goals = this.goals.filter(g => g.id !== btn.dataset.id);
            await this.store.set('neuro_goals', this.goals);
            this.renderGoals();
            showToast('Meta removida!', 'error');
          }
        });
      });
    }

    // ———— REPORTS ————
    renderReports() {
      const totalIncome = this.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = this.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      $('#report-total-income').textContent = formatBRL(totalIncome);
      $('#report-total-expense').textContent = formatBRL(totalExpense);
      const balance = totalIncome - totalExpense;
      const balEl = $('#report-total-balance');
      balEl.textContent = formatBRL(balance);
      balEl.style.color = balance >= 0 ? 'var(--neuro-green)' : 'var(--neuro-red)';

      const months = {};
      this.transactions.forEach(tx => {
        const key = getMonthKey(tx.date);
        if (!months[key]) months[key] = { income: 0, expense: 0 };
        months[key][tx.type] += tx.amount;
      });

      const sortedMonths = Object.keys(months).sort().reverse();
      const tbody = $('#report-months-tbody');

      if (!sortedMonths.length) {
        tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">📊</div><p>Sem dados para exibir.</p></div></td></tr>`;
        return;
      }

      tbody.innerHTML = sortedMonths.map(key => {
        const m = months[key];
        const bal = m.income - m.expense;
        const label = getMonthYear(key + '-01');
        return `
          <tr>
            <td style="text-transform:capitalize;font-weight:600;">${label}</td>
            <td style="color:var(--neuro-green)">${formatBRL(m.income)}</td>
            <td style="color:var(--neuro-red)">${formatBRL(m.expense)}</td>
            <td style="color:${bal >= 0 ? 'var(--neuro-green)' : 'var(--neuro-red)'};font-weight:700">${formatBRL(bal)}</td>
          </tr>
        `;
      }).join('');
    }

    // ———— CHARTS ————
    drawCharts() {
      const [year, month] = this.selectedMonth.split('-').map(Number);
      const barData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, month - 1 - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const monthTx = this.transactions.filter(t => getMonthKey(t.date) === key);
        barData.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        });
      }
      this.barChart.draw(barData);

      // Pie chart: only show expenses for selectedMonth
      const expenseTx = this.transactions.filter(t => t.type === 'expense' && getMonthKey(t.date) === this.selectedMonth);
      const cats = {};
      expenseTx.forEach(tx => {
        cats[tx.category] = (cats[tx.category] || 0) + tx.amount;
      });
      const pieData = Object.entries(cats)
        .map(([label, value]) => ({
          label,
          value,
          color: getCategoryColor(label)
        }))
        .sort((a, b) => b.value - a.value);
      this.pieChart.draw(pieData);
    }
  }

  // ———— BOOT ————
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceApp();
  });

})();
