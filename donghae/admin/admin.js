const supabaseClient = supabase.createClient(
"https://hkswzghtmeeftjmnnsmx.supabase.co",
"sb_publishable_5YfaypCKMP8y_H_u3_dBGw_MZ9CIPG9"
);

async function addNotice(){

let title = document.getElementById("title").value;
let content = document.getElementById("content").value;

await supabaseClient
.from("notices")
.insert([
{
title:title,
content:content
}
]);

alert("공지 추가 완료");

}
