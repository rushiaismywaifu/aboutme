document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.getElementById('cursor');
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');

    // 觸控裝置不執行
    const isTouchDevice = matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isTouchDevice) return;

    // Canvas 尺寸
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 游標狀態
    let mouseX = -100, mouseY = -100;
    let cursorX = -100, cursorY = -100;

    // 粒子池（避免不斷建立/銷毀物件）
    const particles = [];
    const MAX_PARTICLES = 50;
    let frameCount = 0;

    class Particle {
        constructor() {
            this.reset(0, 0);
        }

        reset(x, y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.alpha = 1;
            this.size = Math.random() * 3 + 1;
            this.life = 1;
            this.decay = Math.random() * 0.02 + 0.015;
            this.active = true;

            // 隨機顏色 (藍-青色系)
            this.hue = 200 + Math.random() * 40;
        }

        update() {
            if (!this.active) return;
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
            this.alpha = this.life;
            this.size *= 0.98;

            if (this.life <= 0) {
                this.active = false;
            }
        }

        draw(ctx) {
            if (!this.active) return;
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, ${this.alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // 預先建立粒子池
    for (let i = 0; i < MAX_PARTICLES; i++) {
        particles.push(new Particle());
        particles[i].active = false;
    }

    function spawnParticle(x, y) {
        for (const p of particles) {
            if (!p.active) {
                p.reset(x, y);
                return;
            }
        }
    }

    // 滑鼠事件
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // 懸停偵測（按鈕、連結等）
    const hoverTargets = document.querySelectorAll('a, button, .avatar');
    hoverTargets.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });

    // 動畫迴圈
    function animate() {
        // 平滑跟隨游標
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';

        // 每 3 幀生成一個粒子（降低頻率）
        frameCount++;
        if (frameCount % 3 === 0 && mouseX > 0) {
            spawnParticle(mouseX, mouseY);
        }

        // 繪製粒子
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
            p.update();
            p.draw(ctx);
        }

        requestAnimationFrame(animate);
    }

    animate();
});