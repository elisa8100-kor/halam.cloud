// 로컬 스토리지에서 최고 점수 불러오기
function loadBestScore() {
    const bestScore = localStorage.getItem('bestScore');
    return bestScore ? parseInt(bestScore) : 0;  // 최고 점수 없으면 0 반환
}

// 로컬 스토리지에서 최고 콤보 불러오기
function loadBestCombo() {
    const bestCombo = localStorage.getItem('bestCombo');
    return bestCombo ? parseInt(bestCombo) : 0;  // 최고 콤보 없으면 0 반환
}

// 로컬 스토리지에 최고 점수 저장하기
function saveBestScore(score) {
    const bestScore = loadBestScore();
    if (score > bestScore) {
        localStorage.setItem('bestScore', score);  // 새로운 최고 점수 저장
    }
}

// 로컬 스토리지에 최고 콤보 저장하기
function saveBestCombo(combo) {
    const bestCombo = loadBestCombo();
    if (combo > bestCombo) {
        localStorage.setItem('bestCombo', combo);  // 새로운 최고 콤보 저장
    }
}

// 최고 점수 불러오기 및 UI에 표시하기
function displayBestScore() {
    const bestScore = loadBestScore();
    document.getElementById('bestScore').innerText = `Best Score: ${bestScore}`;
}

// 최고 콤보 불러오기 및 UI에 표시하기
function displayBestCombo() {
    const bestCombo = loadBestCombo();
    document.getElementById('bestCombo').innerText = `Best Combo: ${bestCombo}`;
}
