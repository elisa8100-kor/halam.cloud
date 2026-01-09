// HUD 업데이트 함수 (점수, 콤보, 최대 콤보, 남은 시간)
function updateHUD(score, combo, maxCombo, timeLeft) {
    document.getElementById('score').innerText = `Score: ${score}`;
    document.getElementById('combo').innerText = `Combo: ${combo}`;
    document.getElementById('maxCombo').innerText = `Max Combo: ${maxCombo}`;
    document.getElementById('timeLeft').innerText = `Time: ${timeLeft}s`;
}

// 두더지 표시 (홀에 두더지 활성화)
function showMole(hole) {
    hole.classList.add('active');
}

// 두더지 숨기기 (홀에서 두더지 비활성화)
function hideMole(hole) {
    hole.classList.remove('active');
}

// 게임 오버 모달 업데이트
function showGameOverModal(finalScore, finalCombo) {
    document.getElementById('gameOverModal').style.display = 'flex';
    document.getElementById('finalScore').innerText = `최종 점수: ${finalScore}`;
    document.getElementById('finalCombo').innerText = `최대 콤보: ${finalCombo}`;
}

// 게임 오버 모달 숨기기
function hideGameOverModal() {
    document.getElementById('gameOverModal').style.display = 'none';
}

// 게임 오버 모달에서 "다시 시작" 버튼 클릭 시 게임 리셋
function setupRestartButton(restartCallback) {
    const restartButton = document.getElementById('restartBtn');
    restartButton.addEventListener('click', () => {
        hideGameOverModal();
        restartCallback();
    });
}

// 홀 클릭 시 두더지 클릭 애니메이션 (추가 효과)
function applyClickAnimation(hole) {
    hole.classList.add('clicked');
    setTimeout(() => {
        hole.classList.remove('clicked');
    }, 200); // 0.2초 후 클릭 효과 제거
}
