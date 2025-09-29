/**
 * 연주시차 시뮬레이터
 * 지구의 공전으로 인한 별의 연주시차 효과를 시각화
 */

class ParallaxSimulator {
    constructor() {
        // 캔버스 요소 가져오기
        this.solarCanvas = document.getElementById('solarCanvas');
        this.starCanvas = document.getElementById('starCanvas');
        this.solarCtx = this.solarCanvas.getContext('2d');
        this.starCtx = this.starCanvas.getContext('2d');

        // 시뮬레이션 상태
        this.time = 0;                  // 현재 시간 (년 단위)
        this.isPlaying = false;         // 애니메이션 재생 상태
        this.isDragging = false;        // 지구 드래그 상태
        this.animationSpeed = 1.0;      // 애니메이션 속도 배수
        this.lastTime = 0;              // 마지막 프레임 시간

        // 물리적 상수
        this.AU = 1.0;                  // 천문단위 (지구-태양 거리)
        this.earthOrbitRadius = 180;    // 지구 궤도 반지름 (픽셀)
        this.centerX = 250;             // 캔버스 중심 X
        this.centerY = 250;             // 캔버스 중심 Y

        // 별 데이터 (교육용 가상 시나리오)
        // 실제로는 서로 다른 거리의 별이 같은 하늘 영역에 나타나는 경우는 드물지만,
        // 연주시차 원리 이해를 위한 교육적 예시입니다.
        this.stars = [
            {
                name: 'A',
                realName: '가상의 근거리 별 α',
                baseX: 90,              // 같은 하늘 영역에 배치
                baseY: -80,             // 약 20도 각도차 
                distance: 2.5,          // 거리 (파섹)
                color: '#ff4444',       // 별 색상
                size: 6,                // 별 크기
                brightness: 1.2         // 밝기 배수
            },
            {
                name: 'B',
                realName: '가상의 원거리 별 β',
                baseX: 110,             // 별 A와 비슷한 방향
                baseY: -60,             // 약 25도 각도차
                distance: 5.0,          // 더 먼 거리
                color: '#ff6666',
                size: 5,                // 거리가 멀어 작게
                brightness: 1.0
            }
        ];

        // 배경 별들 (연주시차 효과 없음)
        this.backgroundStars = this.generateBackgroundStars(25);

        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 애니메이션 시작
        this.animate();
        
        // 초기 UI 업데이트
        this.updateUI();
    }

    /**
     * 배경 별들 생성 (연주시차 효과 없는 먼 별들)
     */
    generateBackgroundStars(count) {
        var stars = [];
        
        // 고정된 시드로 일관된 별 배치
        var seed = 42;
        var random = function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        for (var i = 0; i < count; i++) {
            var angle = random() * 2 * Math.PI;
            var radius = 100 + random() * 120; // 100~220 픽셀 거리
            
            stars.push({
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
                size: 1 + random() * 2,
                color: `rgba(200, 200, 200, ${0.3 + random() * 0.4})`,
                twinkle: random() * 2 * Math.PI // 반짝임 위상
            });
        }
        
        return stars;
    }

    /**
     * 연주시차 계산 (교육적 단순화: 일직선 운동)
     * 공식: parallax (arcsec) = 1 / distance (parsec)
     * 가정: 별이 지구 공전궤도와 정확히 같은 면에 있어서 좌우로만 이동
     */
    calculateParallax(star, earthAngle) {
        // 이론적 연주시차 (각초 단위)
        var theoreticalParallax = 1.0 / star.distance;
        
        // 지구의 X축 위치 (공전궤도 상에서)
        var earthX = Math.cos(earthAngle);
        
        // 교육적 단순화: 별이 지구 공전궤도와 같은 면에 있다고 가정
        // 따라서 Y축 방향 움직임은 없고, X축 방향으로만 일직선 이동
        var parallaxScale = 20; // 시각적 효과를 위한 스케일 팩터 (증가)
        var deltaX = -earthX * theoreticalParallax * parallaxScale;
        var deltaY = 0; // 일직선 운동: Y축 변화 없음
        
        return {
            parallax: theoreticalParallax,
            deltaX: deltaX,
            deltaY: deltaY,
            apparentX: star.baseX + deltaX,
            apparentY: star.baseY + deltaY // Y축 고정
        };
    }

    /**
     * 태양계 뷰 그리기
     */
    drawSolarSystem() {
        const ctx = this.solarCtx;
        
        // 배경 클리어
        ctx.fillStyle = 'rgba(0, 8, 20, 0.95)';
        ctx.fillRect(0, 0, 500, 500);
        
        // 격자 그리기
        this.drawGrid(ctx);
        
        // 지구 궤도 그리기
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.earthOrbitRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 태양 그리기
        const sunGradient = ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, 20);
        sunGradient.addColorStop(0, '#fff700');
        sunGradient.addColorStop(0.3, '#ffaa00');
        sunGradient.addColorStop(1, '#ff6600');
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // 태양 광선 효과
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x1 = this.centerX + Math.cos(angle) * 20;
            const y1 = this.centerY + Math.sin(angle) * 20;
            const x2 = this.centerX + Math.cos(angle) * 35;
            const y2 = this.centerY + Math.sin(angle) * 35;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // 지구 위치 계산 (북쪽에서 볼 때 반시계방향 공전)
        const earthAngle = -this.time * 2 * Math.PI; // 음수로 반시계방향 설정
        const earthX = this.centerX + this.earthOrbitRadius * Math.cos(earthAngle);
        const earthY = this.centerY + this.earthOrbitRadius * Math.sin(earthAngle);
        
        // 지구 그리기
        const earthGradient = ctx.createRadialGradient(earthX - 3, earthY - 3, 0, earthX, earthY, 10);
        earthGradient.addColorStop(0, '#87ceeb');
        earthGradient.addColorStop(0.4, '#4169e1');
        earthGradient.addColorStop(1, '#191970');
        
        ctx.fillStyle = earthGradient;
        ctx.beginPath();
        ctx.arc(earthX, earthY, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // 지구 테두리
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 별들로의 관측선 그리기
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        this.stars.forEach(star => {
            // 별의 실제 위치 (같은 하늘 영역에 배치 - 교육적 시나리오)
            // 실제로는 매우 먼 거리에 있으므로 시각적으로 같은 방향으로 표시
            const starX = this.centerX + star.baseX * 1.8;
            const starY = this.centerY + star.baseY * 1.8;
            
            ctx.beginPath();
            ctx.moveTo(earthX, earthY);
            ctx.lineTo(starX, starY);
            ctx.stroke();
            
            // 별 표시
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(starX, starY, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // 별 이름
            ctx.fillStyle = 'white';
            ctx.font = '12px Inter';
            ctx.fillText(`별 ${star.name}`, starX + 8, starY - 8);
        });
        
        // 지구 위치 표시
        ctx.fillStyle = 'rgba(100, 255, 218, 0.8)';
        ctx.font = '14px Inter';
        ctx.fillText('지구', earthX + 12, earthY - 12);
        
        // 태양 라벨
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('태양', this.centerX, this.centerY + 35);
        ctx.textAlign = 'left';
    }

    /**
     * 격자 그리기
     */
    drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // 수직선
        for (let x = 0; x <= 500; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 500);
            ctx.stroke();
        }
        
        // 수평선
        for (let y = 0; y <= 500; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(500, y);
            ctx.stroke();
        }
    }

    /**
     * 별 관측 뷰 그리기
     */
    drawStarField() {
        const ctx = this.starCtx;
        
        // 배경 클리어
        ctx.fillStyle = 'rgba(0, 8, 20, 0.95)';
        ctx.fillRect(0, 0, 500, 500);
        
        // 격자 그리기
        this.drawGrid(ctx);
        
        const earthAngle = -this.time * 2 * Math.PI; // 반시계방향 공전
        const currentTime = Date.now() * 0.001;
        
        // 배경 별들 그리기 (연주시차 없음, 반짝임 효과 있음)
        this.backgroundStars.forEach(bgStar => {
            const twinkleIntensity = 0.8 + 0.2 * Math.sin(currentTime * 2 + bgStar.twinkle);
            
            ctx.fillStyle = bgStar.color.replace(/[\d.]+\)$/, `${twinkleIntensity * 0.6})`);
            ctx.beginPath();
            ctx.arc(
                this.centerX + bgStar.x, 
                this.centerY + bgStar.y, 
                bgStar.size * twinkleIntensity, 
                0, 2 * Math.PI
            );
            ctx.fill();
        });
        
        // 근거리 별들 그리기 (연주시차 효과 있음)
        this.stars.forEach(star => {
            const parallaxData = this.calculateParallax(star, earthAngle);
            
            const x = this.centerX + parallaxData.apparentX;
            const y = this.centerY + parallaxData.apparentY;
            
            // 별의 광휘 효과
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 4);
            glowGradient.addColorStop(0, star.color);
            glowGradient.addColorStop(0.4, star.color + '80');
            glowGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, y, star.size * 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // 별 본체
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(x, y, star.size, 0, 2 * Math.PI);
            ctx.fill();
            
            // 별 이름과 정보
            ctx.fillStyle = 'white';
            ctx.font = '14px Inter';
            ctx.fillText(`별 ${star.name}`, x + 12, y - 12);
            
            // 연주시차 정보 업데이트
            document.getElementById(`star${star.name}Parallax`).textContent = 
                parallaxData.parallax.toFixed(3) + '"';
        });
        
        // 중심 십자선
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.centerX - 15, this.centerY);
        ctx.lineTo(this.centerX + 15, this.centerY);
        ctx.moveTo(this.centerX, this.centerY - 15);
        ctx.lineTo(this.centerX, this.centerY + 15);
        ctx.stroke();
        
        // 관측 방향 표시
        ctx.fillStyle = 'rgba(100, 255, 218, 0.8)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('관측 중심', this.centerX, this.centerY + 30);
        ctx.textAlign = 'left';
    }

    /**
     * UI 정보 업데이트
     */
    updateUI() {
        const earthAngle = -this.time * 2 * Math.PI; // 반시계방향 공전
        const degrees = ((360 - (this.time * 360)) % 360).toFixed(1); // 반시계방향 각도
        
        // 시간 정보 업데이트
        document.getElementById('timeDisplay').textContent = this.time.toFixed(2) + '년';
        document.getElementById('earthPos').textContent = degrees + '°';
        
        // 계절 계산
        let seasonIndex = Math.floor((this.time % 1) * 4);
        const seasons = ['봄 (춘분)', '여름 (하지)', '가을 (추분)', '겨울 (동지)'];
        document.getElementById('season').textContent = seasons[seasonIndex] || '봄';
        
        // 속도 표시 업데이트
        document.getElementById('speedDisplay').textContent = this.animationSpeed.toFixed(1) + 'x';
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 컨트롤 버튼들
        var self = this;
        document.getElementById('playBtn').addEventListener('click', function() { self.play(); });
        document.getElementById('pauseBtn').addEventListener('click', function() { self.pause(); });
        document.getElementById('resetBtn').addEventListener('click', function() { self.reset(); });
        
        // 속도 슬라이더
        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', function(e) {
            self.animationSpeed = parseFloat(e.target.value);
            self.updateUI();
        });
        
        // 마우스 이벤트 (지구 드래그)
        this.solarCanvas.addEventListener('mousedown', function(e) { self.onMouseDown(e); });
        this.solarCanvas.addEventListener('mousemove', function(e) { self.onMouseMove(e); });
        this.solarCanvas.addEventListener('mouseup', function() { self.onMouseUp(); });
        this.solarCanvas.addEventListener('mouseleave', function() { self.onMouseUp(); });
        
        // 터치 이벤트 (모바일 지원)
        this.solarCanvas.addEventListener('touchstart', function(e) { self.onTouchStart(e); });
        this.solarCanvas.addEventListener('touchmove', function(e) { self.onTouchMove(e); });
        this.solarCanvas.addEventListener('touchend', function() { self.onMouseUp(); });
    }

    /**
     * 마우스 다운 이벤트
     */
    onMouseDown(e) {
        const rect = this.solarCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const earthAngle = -this.time * 2 * Math.PI; // 반시계방향 공전
        const earthX = this.centerX + this.earthOrbitRadius * Math.cos(earthAngle);
        const earthY = this.centerY + this.earthOrbitRadius * Math.sin(earthAngle);
        
        const distance = Math.sqrt((x - earthX) ** 2 + (y - earthY) ** 2);
        
        if (distance < 25) { // 지구 클릭 감지 범위
            this.isDragging = true;
            this.pause(); // 드래그 중에는 자동 재생 정지
            this.solarCanvas.style.cursor = 'grabbing';
        }
    }

    /**
     * 마우스 이동 이벤트
     */
    onMouseMove(e) {
        if (!this.isDragging) {
            // 마우스가 지구 위에 있는지 확인하여 커서 변경
            const rect = this.solarCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const earthAngle = -this.time * 2 * Math.PI; // 반시계방향 공전
            const earthX = this.centerX + this.earthOrbitRadius * Math.cos(earthAngle);
            const earthY = this.centerY + this.earthOrbitRadius * Math.sin(earthAngle);
            
            const distance = Math.sqrt((x - earthX) ** 2 + (y - earthY) ** 2);
            
            this.solarCanvas.style.cursor = distance < 25 ? 'grab' : 'default';
            return;
        }
        
        const rect = this.solarCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.centerX;
        const y = e.clientY - rect.top - this.centerY;
        
        // 각도 계산 및 시간 업데이트 (반시계방향)
        let angle = Math.atan2(y, x);
        if (angle < 0) angle += 2 * Math.PI;
        
        // 반시계방향으로 변환
        this.time = (2 * Math.PI - angle) / (2 * Math.PI);
        this.updateUI();
    }

    /**
     * 터치 시작 이벤트
     */
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.onMouseDown({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }

    /**
     * 터치 이동 이벤트
     */
    onTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.onMouseMove({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }

    /**
     * 마우스 업 이벤트
     */
    onMouseUp() {
        this.isDragging = false;
        this.solarCanvas.style.cursor = 'default';
    }

    /**
     * 애니메이션 재생
     */
    play() {
        this.isPlaying = true;
        document.getElementById('playBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
    }

    /**
     * 애니메이션 정지
     */
    pause() {
        this.isPlaying = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }

    /**
     * 리셋
     */
    reset() {
        this.time = 0;
        this.pause();
        this.updateUI();
    }

    /**
     * 메인 애니메이션 루프
     */
    animate(currentTime = 0) {
        // 시간 진행 (자동 재생 중일 때만)
        if (this.isPlaying && !this.isDragging) {
            const deltaTime = (currentTime - this.lastTime) / 1000; // 초 단위로 변환
            this.time += deltaTime * 0.1 * this.animationSpeed; // 0.1년/초 기본 속도
            
            if (this.time >= 1) this.time -= 1; // 1년 주기로 순환
        }
        
        this.lastTime = currentTime;
        
        // 화면 그리기
        this.drawSolarSystem();
        this.drawStarField();
        
        // UI 업데이트
        if (!this.isDragging) {
            this.updateUI();
        }
        
        // 다음 프레임 요청
        var self = this;
        requestAnimationFrame(function(time) { 
            self.animate(time); 
        });
    }
}

// DOM 로드 완료 후 시뮬레이터 시작
document.addEventListener('DOMContentLoaded', function() {
    new ParallaxSimulator();
});
