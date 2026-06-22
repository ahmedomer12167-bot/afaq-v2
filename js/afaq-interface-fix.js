(function(){
function read(key){try{return JSON.parse(localStorage.getItem(key))||[]}catch(e){return[]}}
function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
function updateCounts(){setText("homeStudentsCount",read("afaq_students").length);setText("homeTeachersCount",read("afaq_teachers").length);setText("homeSubjectsCount",read("afaq_subjects").length);setText("homeExamsCount",read("afaq_exams").length)}
function tilt(){document.querySelectorAll(".role-card,.stat-card,.hero-btn").forEach(card=>{card.addEventListener("mousemove",e=>{if(window.innerWidth<800)return;const r=card.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;const rx=((y-r.height/2)/(r.height/2))*-5,ry=((x-r.width/2)/(r.width/2))*5;card.style.transform=`translateY(-10px) rotateX(${rx}deg) rotateY(${ry}deg)`});card.addEventListener("mouseleave",()=>card.style.transform="")})}
document.addEventListener("DOMContentLoaded",()=>{updateCounts();tilt()});
window.addEventListener("storage",updateCounts);
window.addEventListener("afaqDataUpdated",updateCounts);
})();