// Supabase 연결 (변수 이름 충돌 방지)
const SUPABASE_URL = "https://hkswzghtmeeftjmnnsmx.supabase.co"
const SUPABASE_KEY = "sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9"

// 라이브러리에서 createClient만 가져오기
const { createClient } = window.supabase

// supabase 대신 db 사용
const db = createClient(SUPABASE_URL, SUPABASE_KEY)

let notices = []

async function loadNotices(){

const { data } = await db
.from("notices")
.select("*")
.order("created_at",{ascending:false})

notices = data || []

renderToday()
renderTomorrow()
renderNotice()

}

function renderToday(){

const today = new Date().toISOString().split("T")[0]

const list = notices.filter(n =>
n.type === "homework" && n.due_date === today
)

const box = document.getElementById("todayHomework")
box.innerHTML = ""

list.forEach(n=>{

const div = document.createElement("div")
div.className = "card"

div.innerHTML = `
<b>📚 ${n.title}</b>
<p>${n.content}</p>
`

box.appendChild(div)

})

}

function renderTomorrow(){

const d = new Date()
d.setDate(d.getDate()+1)
const tomorrow = d.toISOString().split("T")[0]

const list = notices.filter(n =>
n.type === "supply" && n.due_date === tomorrow
)

const box = document.getElementById("tomorrowSupply")
box.innerHTML = ""

list.forEach(n=>{

const div = document.createElement("div")
div.className = "card"

div.innerHTML = `
<b>🎒 ${n.title}</b>
<p>${n.content}</p>
`

box.appendChild(div)

})

}

function renderNotice(){

const box = document.getElementById("noticeList")
box.innerHTML = ""

const list = notices.filter(n => n.type === "notice")

list.forEach(n=>{

const div = document.createElement("div")
div.className = "card"

div.innerHTML = `
<b>📢 ${n.title}</b>
<p>${n.content.substring(0,60)}...</p>
`

div.onclick = ()=> alert(n.content)

box.appendChild(div)

})

}

loadNotices()
