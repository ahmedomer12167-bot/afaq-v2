/* =========================================================
   AFAQ PREMIUM HOVER JS
   - Tilt 3D على الكمبيوتر فقط
   - Animated Counter عند تغير الأرقام
   ========================================================= */
(function(){
  const isMobile = window.matchMedia("(max-width: 750px)").matches;

  function initTilt(){
    if(isMobile) return;

    const cards = document.querySelectorAll(".role-card, .afaq-tile, .stat-card, .home-stat, .stat, .afaq-card");

    cards.forEach(card => {
      card.addEventListener("mousemove", e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        card.style.transform =
          `translateY(-12px) scale(1.025) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  function animateValue(el, start, end, duration, suffix){
    const startTime = performance.now();
    const diff = end - start;

    function tick(now){
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + diff * eased);

      el.textContent = value + (suffix || "");

      if(progress < 1){
        requestAnimationFrame(tick);
      } else {
        el.textContent = end + (suffix || "");
        el.classList.add("counter-flash");
        setTimeout(() => el.classList.remove("counter-flash"), 650);
      }
    }

    requestAnimationFrame(tick);
  }

  function initCounterObserver(){
    const counters = document.querySelectorAll("[data-count], .home-stat strong, .stat strong, .afaq-stat strong, .stat-card strong");

    counters.forEach(el => {
      el.dataset.afaqLastValue = parseInt(String(el.textContent).replace(/\D/g,"")) || 0;
    });

    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        const el = m.target;
        if(!el || !el.textContent) return;

        const txt = String(el.textContent).trim();
        const hasPercent = txt.includes("%");
        const next = parseInt(txt.replace(/\D/g,"")) || 0;
        const prev = parseInt(el.dataset.afaqLastValue || "0") || 0;

        if(next !== prev){
          el.dataset.afaqLastValue = next;
          animateValue(el, prev, next, 450, hasPercent ? "%" : "");
        }
      });
    });

    counters.forEach(el => {
      observer.observe(el, {childList:true, characterData:true, subtree:true});
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTilt();
    initCounterObserver();
  });
})();
