const supabaseClient = window.supabase.createClient(
"https://hkswzghtmeeftjmnnsmx.supabase.co",
"sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9"
)

let notices=[]

async function loadNotices(){

const { data } = await supabaseClient
.from("notices")
.select("*")
.order("created_at",{ascending:false})

notices=data || []

renderList(notices)
renderToday()
renderTomorrow()

}

function renderList(list){

const container=document.getElementById("noticeList")
container.innerHTML=""

list.forEach(n=>{

if(n.type==="homework" || n.type==="supply") return

const div=document.createElement("div")
div.className="card"

div.innerHTML=`
<h3>${icon(n.type)} ${n.title}</h3>
<p>${short(n.content)}</p>
`

div.onclick=()=>{
alert(n.content)
}

container.appendChild(div)

})

}

function renderToday(){

const container=document.getElementById("todayHomework")
container.innerHTML=""

const today=new Date().toISOString().split("T")[0]

const list=notices.filter(n=>n.type==="homework" && n.due_date===today)

list.forEach(n=>{

const div=document.createElement("div")
div.className="card"

div.innerHTML=`
<h3>📚 ${n.title}</h3>
<p>${short(n.content)}</p>
`

div.onclick=()=>alert(n.content)

container.appendChild(div)

})

}

function renderTomorrow(){

const container=document.getElementById("tomorrowSupply")
container.innerHTML=""

const d=new Date()
d.setDate(d.getDate()+1)
const tomorrow=d.toISOString().split("T")[0]

const list=notices.filter(n=>n.type==="supply" && n.due_date===tomorrow)

list.forEach(n=>{

const div=document.createElement("div")
div.className="card"

div.innerHTML=`
<h3>🎒 ${n.title}</h3>
<p>${short(n.content)}</p>
`

div.onclick=()=>alert(n.content)

container.appendChild(div)

})

}

function short(text){

if(!text) return ""
if(text.length<60) return text
return text.substring(0,60)+"..."

}

function icon(type){

if(type==="homework") return "📚"
if(type==="supply") return "🎒"
return "📢"

}

function filterType(type){

if(type==="all"){
renderList(notices)
return
}

const filtered=notices.filter(n=>n.type===type)
renderList(filtered)

}

loadNotices()
