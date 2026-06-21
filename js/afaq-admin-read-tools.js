/* AFAQ ADMIN READ TOOLS */
(function(){
  function read(key){
    try{return JSON.parse(localStorage.getItem(key)) || [];}catch(e){return [];}
  }
  function write(key,value){
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }
  function refresh(){
    if(window.AfaqStats) AfaqStats.updateCounters();
    if(window.AfaqBadges) AfaqBadges.updateBadges();
  }
  window.markAdminMessagesRead = function(){
    const messages = read("afaq_messages").map(m=>{
      if(!m.toRole || m.toRole === "admin" || m.toId === "admin"){
        return {...m, read:true, seen:true, isNew:false};
      }
      return m;
    });
    write("afaq_messages", messages);
    refresh();
    alert("تمت قراءة رسائل المدير وتصفير الشارة.");
  };
  window.markAdminNotificationsRead = function(){
    const notifications = read("afaq_notifications").map(n=>{
      if(!n.toRole || n.toRole === "admin" || n.toId === "admin"){
        return {...n, read:true, seen:true, isNew:false};
      }
      return n;
    });
    write("afaq_notifications", notifications);
    refresh();
    alert("تمت قراءة إشعارات المدير وتصفير العداد.");
  };
})();
