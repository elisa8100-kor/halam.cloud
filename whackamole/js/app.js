// 변수 설정
let score = 0;
let combo = 0;
let maxCombo = 0;
let timeLeft = 60;
let gameInterval;
let spawnInterval;
let isGameRunning = false;
let holes = [];

// 게임 시작
function startGame() {
    resetGame(); // 게임 초기화
    isGameRunning = true;
    document.getElementById('gameOverModal').style.display = 'none'; // 게임 오버 모달 숨기기
    document.getElementById('restartBtn').addEventListener('click', startGame); // 다시 시작 버튼 리스너 등록

    // 게임 타이머 시작
    gameInterval = setInterval(() => {
        timeLeft--;
        updateHUD(); // HUD 업데이트
        if (timeLeft <= 0) {
            endGame(); // 게임 종료
        }
    }, 1000);

    // 두더지 스폰 시작
    spawnInterval = setInterval(() => {
        if (isGameRunning) {
            spawnMole(); // 두더지 랜덤 스폰
        }
    }, 1000);
}

// 게임 종료
function endGame() {
    clearInterval(gameInterval); // 타이머 종료
    clearInterval(spawnInterval); // 두더지 스폰 종료
    isGameRunning = false;
    
    // 게임 오버 모달 표시
    document.getElementById('gameOverModal').style.display = 'flex';
    document.getElementById('finalScore').innerText = `최종 점수: ${score}`;
    document.getElementById('finalCombo').innerText = `최대 콤보: ${maxCombo}`;
    
    // 최고 점수 저장
    saveBestScore();
}

// 게임 초기화
function resetGame() {
    score = 0;
    combo = 0;
    maxCombo = 0;
    timeLeft = 60;
    holes = document.querySelectorAll('.hole'); // 모든 홀 선택
    holes.forEach(hole => {
        hole.classList.remove('active'); // 두더지 숨기기
    });
    updateHUD(); // 초기 HUD 업데이트
}

// HUD 업데이트
function updateHUD() {
    document.getElementById('score').innerText = `Score: ${score}`;
    document.getElementById('combo').innerText = `Combo: ${combo}`;
    document.getElementById('maxCombo').innerText = `Max Combo: ${maxCombo}`;
    document.getElementById('timeLeft').innerText = `Time: ${timeLeft}s`;
}

// 두더지 랜덤 스폰
function spawnMole() {
    // 랜덤 홀 선택
    const randomHole = holes[Math.floor(Math.random() * holes.length)];
    if (!randomHole.classList.contains('active')) {
        randomHole.classList.add('active'); // 두더지 활성화
        setTimeout(() => {
            randomHole.classList.remove('active'); // 두더지 숨기기
        }, 1000); // 1초 후에 숨기기
    }
}

// 홀 클릭 처리
function handleHoleClick(event) {
    if (!isGameRunning) return; // 게임이 진행 중이 아니면 클릭 무시
    const hole = event.target;

    if (hole.classList.contains('active')) {
        score += 10;
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        hole.classList.remove('active');
        playSound('hit'); // 타격 효과음
    } else {
        combo = 0;
        playSound('miss'); // 틀린 클릭 효과음
    }
    updateHUD(); // HUD 업데이트
}

// 사운드 재생
function playSound(type) {
    const sound = {
        hit: 'audio/hit.mp3',
        miss: 'audio/miss.mp3',
        'combo-break': 'audio/combo-break.mp3'
    };
    const audio = new Audio(sound[type]);
    audio.play();
}

// 최고 점수 저장
function saveBestScore() {
    const bestScore = localStorage.getItem('bestScore');
    if (!bestScore || score > bestScore) {
        localStorage.setItem('bestScore', score);
    }
}

// 게임 시작 버튼 처리
document.addEventListener('DOMContentLoaded', () => {
    // 각 홀에 클릭 이벤트 추가
    holes.forEach(hole => {
        hole.addEventListener('click', handleHoleClick);
    });

    // 게임 시작
    startGame();
});
