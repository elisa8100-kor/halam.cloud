const supabase = window.supabase.createClient(
"https://hkswzghtmeeftjmnnsmx.supabase.co",
"sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9"
)

function login(){

const pw=document.getElementById("pw").value

if(pw==="donghae2026"){

document.getElementById("login").style.display="none"
document.getElementById("panel").style.display="block"

}

}

async function addNotice(){

const title=document.getElementById("title").value
const content=document.getElementById("content").value
const type=document.getElementById("type").value
const due_date=document.getElementById("date").value

await supabase
.from("notices")
.insert([{title,content,type,due_date}])

alert("추가 완료")

}
