
(function(){
  function read(key){
    try{return JSON.parse(localStorage.getItem(key))||[]}catch(e){return[]}
  }

  function setText(id,value){
    const el=document.getElementById(id);
    if(el)el.textContent=value;
  }

  function updateCounts(){
    setText("homeStudentsCount",read("afaq_students").length);
    setText("homeTeachersCount",read("afaq_teachers").length);
    setText("homeSubjectsCount",read("afaq_subjects").length);
    setText("homeExamsCount",read("afaq_exams").length);
  }

  function addTilt(){
    document.querySelectorAll(".role-card,.stat-card,.card,.cardx,.sync-card,.afaq-tile,.hero-btn").forEach(card=>{
      card.addEventListener("mousemove",e=>{
        if(window.innerWidth<850)return;
        const r=card.getBoundingClientRect();
        const x=e.clientX-r.left;
        const y=e.clientY-r.top;
        const rx=((y-r.height/2)/(r.height/2))*-4;
        const ry=((x-r.width/2)/(r.width/2))*4;
        card.style.transform=`translateY(-8px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener("mouseleave",()=>card.style.transform="");
    });
  }

  function normalizeButtons(){
    document.querySelectorAll("button").forEach(btn=>{
      if(!btn.classList.length) btn.classList.add("afaq-btn");
    });
  }

  document.addEventListener("DOMContentLoaded",()=>{
    updateCounts();
    normalizeButtons();
    addTilt();
  });

  window.addEventListener("storage",updateCounts);
  window.addEventListener("afaqDataUpdated",updateCounts);
})();
