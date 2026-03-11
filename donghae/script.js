const supabaseClient = supabase.createClient(
"https://hkswzghtmeeftjmnnsmx.supabase.co",
"sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9"
);

async function loadNotices(){

const { data } = await supabaseClient
.from("notices")
.select("*")
.order("id",{ascending:false});

let list = document.getElementById("noticeList");
list.innerHTML="";

data.forEach(n=>{

list.innerHTML += `
<div class="notice">
<h3>${n.title}</h3>
<p>${n.content}</p>
<small>${new Date(n.created_at).toLocaleString()}</small>
</div>
`;

});

}

loadNotices();
