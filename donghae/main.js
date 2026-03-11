const supabase = window.supabase.createClient(
"https://hkswzghtmeeftjmnnsmx.supabase.co",
"sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9"
)

let notices=[]

async function loadNotices(){

const { data } = await supabase
.from("notices")
.select("*")
.order("created_at",{ascending:false})

notices=data
renderList(data)

}

function renderList(list){

const container=document.getElementById("noticeList")
container.innerHTML=""

list.forEach(n=>{

const div=document.createElement("div")
div.className="card"

div.innerHTML=`
<h3>${icon(n.type)} ${n.title}</h3>
<p>${n.content.substring(0,60)}...</p>
`

div.onclick=()=>{
alert(n.content)
}

container.appendChild(div)

})

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
