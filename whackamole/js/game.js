// 두더지 구멍들
const holes = document.querySelectorAll('.hole');

// 타이머와 두더지 스폰을 위한 변수
let spawnTimer;
let gameTimer;
let score = 0;
let combo = 0;
let maxCombo = 0;
let timeLeft = 60;
let isGameRunning = false;

// 두더지 스폰 타이머 (랜덤 간격으로 두더지 나타남)
function spawnMole() {
    if (!isGameRunning) return; // 게임이 종료되면 스폰하지 않음

    // 랜덤한 홀을 선택
    const randomHole = holes[Math.floor(Math.random() * holes.length)];
    
    if (!randomHole.classList.contains('active')) {
        // 두더지가 안 나온 홀에만 나오도록 처리
        randomHole.classList.add('active');
        setTimeout(() => {
            randomHole.classList.remove('active');
        }, 1000);  // 1초 뒤에 두더지 숨기기
    }
}

// 게임 시작
function startGame() {
    resetGame();
    isGameRunning = true;
    spawnMole();  // 게임 시작 시 첫 번째 두더지 스폰
    gameTimer = setInterval(() => {
        timeLeft--;
        updateHUD();
        if (timeLeft <= 0) {
            endGame();  // 시간이 다 되면 게임 종료
        }
    }, 1000); // 1초마다 타이머 감소

    spawnTimer = setInterval(() => {
        spawnMole();  // 랜덤 간격으로 두더지 스폰
    }, 1000);  // 초기에 1초마다 나타나도록 설정
}

// 게임 종료
function endGame() {
    clearInterval(gameTimer);  // 타이머 종료
    clearInterval(spawnTimer); // 두더지 스폰 종료
    isGameRunning = false;     // 게임 종료 상태 설정
    showGameOverModal(score, maxCombo);  // 게임 오버 모달 표시
}

// 게임 리셋
function resetGame() {
    score = 0;
    combo = 0;
    maxCombo = 0;
    timeLeft = 60;
    holes.forEach(hole => hole.classList.remove('active'));  // 모든 구멍에서 두더지 숨기기
    updateHUD();  // 초기 HUD 상태 반영
}

// 점수 및 HUD 업데이트
function updateHUD() {
    updateHUD(score, combo, maxCombo, timeLeft);
}

// 두더지 클릭 처리
function handleHoleClick(event) {
    if (!isGameRunning) return; // 게임이 종료되었으면 클릭 무시

    const hole = event.target;
    
    // 두더지 클릭 시
    if (hole.classList.contains('active')) {
        score += 10;
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        hole.classList.remove('active');  // 두더지 숨기기
        playSound('hit');  // 타격 효과음 재생
    } else {
        combo = 0;  // 두더지 안 나오는 구멍 클릭 시 콤보 초기화
        playSound('miss');  // 틀린 클릭 효과음 재생
    }
    updateHUD();  // UI 업데이트
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

// 초기화 후 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
    holes.forEach(hole => {
        hole.addEventListener('click', handleHoleClick);  // 구멍 클릭 시 이벤트 등록
    });

    startGame();  // 게임 시작
});
