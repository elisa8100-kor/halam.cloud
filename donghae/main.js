const SUPABASE_URL = "https://hkswzghtmeeftjmnnsmx.supabase.co"
const SUPABASE_KEY = "sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9"

const { createClient } = window.supabase
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

const box = document.getElementById("todayHomework")
box.innerHTML = ""

const list = notices.filter(n => n.type === "homework")

if(list.length === 0){
box.innerHTML = "<div class='card'>오늘 숙제 없음</div>"
return
}

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

const box = document.getElementById("tomorrowSupply")
box.innerHTML = ""

const list = notices.filter(n => n.type === "supply")

if(list.length === 0){
box.innerHTML = "<div class='card'>준비물 없음</div>"
return
}

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
