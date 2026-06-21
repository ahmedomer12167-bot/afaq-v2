
(function(){
  const isMobile = matchMedia("(max-width:750px)").matches;

  function initTilt(){
    if(isMobile) return;

    // IMPORTANT: only these cards; no .float-card
    document.querySelectorAll(".role-card,.stat-card").forEach(card=>{
      card.addEventListener("mousemove",e=>{
        const r=card.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
        const rx=((y-r.height/2)/(r.height/2))*-4;
        const ry=((x-r.width/2)/(r.width/2))*4;
        card.style.transform=`translateY(-12px) scale(1.025) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener("mouseleave",()=>card.style.transform="");
    });
  }

  function counters(){
    const els=document.querySelectorAll("[data-count],.stat-card strong");
    els.forEach(el=>el.dataset.last=parseInt(String(el.textContent).replace(/\D/g,""))||0);

    const obs=new MutationObserver(ms=>ms.forEach(m=>{
      const el=m.target;
      const n=parseInt(String(el.textContent).replace(/\D/g,""))||0;
      const p=parseInt(el.dataset.last||"0")||0;
      if(n!==p){
        el.dataset.last=n;
        el.classList.add("counter-flash");
        setTimeout(()=>el.classList.remove("counter-flash"),650);
      }
    }));

    els.forEach(el=>obs.observe(el,{childList:true,characterData:true,subtree:true}));
  }

  document.addEventListener("DOMContentLoaded",()=>{initTilt();counters()});
})();
