const supabaseUrl="https://hkswzghtmeeftjmnnsmx.supabase.co"
const supabaseKey="sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9"

const sb = supabase.createClient(supabaseUrl,supabaseKey)

function login(){

const pw=document.getElementById("pw").value.trim()

if(pw==="donghae2026"){

document.getElementById("login").style.display="none"
document.getElementById("panel").style.display="block"

loadList()

}else{

alert("비밀번호 틀림")

}

}

async function addNotice(){

const title=document.getElementById("title").value
const content=document.getElementById("content").value
const type=document.getElementById("type").value
const due_date=document.getElementById("date").value

await sb
.from("notices")
.insert([{title,content,type,due_date}])

alert("추가 완료")

loadList()

}

async function loadList(){

const { data } = await sb
.from("notices")
.select("*")
.order("created_at",{ascending:false})

const box=document.getElementById("list")
box.innerHTML=""

data.forEach(n=>{

const div=document.createElement("div")
div.className="card"

div.innerHTML=`${n.title} <button onclick="del(${n.id})">삭제</button>`

box.appendChild(div)

})

}

async function del(id){

await sb
.from("notices")
.delete()
.eq("id",id)

loadList()

}
