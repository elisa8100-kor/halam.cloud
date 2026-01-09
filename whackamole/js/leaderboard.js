// 리더보드 데이터 관리
const leaderboardKey = 'leaderboardData';

// 로컬 리더보드에서 데이터 불러오기
function loadLeaderboard() {
    const leaderboard = localStorage.getItem(leaderboardKey);
    return leaderboard ? JSON.parse(leaderboard) : [];  // 없으면 빈 배열 반환
}

// 로컬 리더보드에 데이터 저장하기
function saveLeaderboard(newEntry) {
    let leaderboard = loadLeaderboard();
    
    // 새 기록 추가
    leaderboard.push(newEntry);
    
    // 점수 기준 내림차순 정렬
    leaderboard.sort((a, b) => b.score - a.score || b.maxCombo - a.maxCombo);  // 점수, 최대 콤보 기준 정렬
    
    // 상위 10개까지만 저장 (필요에 따라 변경 가능)
    leaderboard = leaderboard.slice(0, 10);
    
    // 로컬 스토리지에 저장
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
}

// 리더보드 UI에 표시하기
function displayLeaderboard() {
    const leaderboard = loadLeaderboard();
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = ''; // 이전 내용 삭제

    // 리더보드 항목 출력
    leaderboard.forEach((entry, index) => {
        const listItem = document.createElement('li');
        listItem.innerText = `${index + 1}. ${entry.name} - ${entry.score} points - Max Combo: ${entry.maxCombo}`;
        leaderboardList.appendChild(listItem);
    });
}

// 리더보드에 새 기록 추가하기
function addLeaderboardEntry(name, score, maxCombo) {
    const newEntry = { name, score, maxCombo };
    saveLeaderboard(newEntry);
    displayLeaderboard();  // 리더보드 UI 갱신
}

// 게임 오버 시 리더보드에 기록 추가
function handleGameOver(score, maxCombo) {
    const name = prompt("Enter your name:");  // 사용자로부터 이름 입력 받기
    if (name) {
        addLeaderboardEntry(name, score, maxCombo);  // 리더보드에 기록 추가
    }
}
