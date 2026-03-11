const supabaseClient = window.supabase.createClient(
"https://hkswzghtmeeftjmnnsmx.supabase.co",
"sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9"
)

function login(){

const pw=document.getElementById("pw").value

if(pw==="donghae2026"){

document.getElementById("login").style.display="none"
document.getElementById("panel").style.display="block"

loadList()

}

}

async function addNotice(){

const title=document.getElementById("title").value
const content=document.getElementById("content").value
const type=document.getElementById("type").value
const due_date=document.getElementById("date").value

await supabaseClient
.from("notices")
.insert([{title,content,type,due_date}])

alert("추가 완료")

loadList()

}

async function loadList(){

const { data } = await supabaseClient
.from("notices")
.select("*")
.order("created_at",{ascending:false})

const container=document.getElementById("list")
container.innerHTML=""

data.forEach(n=>{

const div=document.createElement("div")
div.className="card"

div.innerHTML=`
<b>${n.title}</b>
<span class="adminBtn" onclick="deleteNotice(${n.id})">삭제</span>
`

container.appendChild(div)

})

}

async function deleteNotice(id){

if(!confirm("삭제?")) return

await supabaseClient
.from("notices")
.delete()
.eq("id",id)

loadList()

}
