document.addEventListener('DOMContentLoaded', function() {
    const cursor = document.querySelector('.custom-cursor');
    const particles = [];

    document.addEventListener('mousemove', (e) => {
        cursor.style.top = e.pageY + 'px';
        cursor.style.left = e.pageX + 'px';

        createParticle(e.pageX, e.pageY);
    });

    function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        document.body.appendChild(particle);

        particle.style.top = y + 'px';
        particle.style.left = x + 'px';

        particles.push(particle);

        // 移除粒子
        setTimeout(() => {
            particle.remove();
            particles.shift();
        }, 1000);
    }
});
