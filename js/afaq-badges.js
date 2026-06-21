/* AFAQ RED BADGES + UNIFIED NEW ITEMS
   ارفعه داخل js/afaq-badges.js
   يعمل مع بيانات localStorage الموحدة.
*/
(function(){
  const K = {
    notifications:"afaq_notifications",
    messages:"afaq_messages",
    subscriptionRequests:"afaq_subscription_requests",
    subjectRequests:"afaq_subject_requests",
    exams:"afaq_exams",
    assignments:"afaq_assignments",
    lessons:"afaq_lessons",
    results:"afaq_results",
    attendance:"afaq_attendance",
    currentStudent:"afaq_current_student",
    currentStudentId:"afaq_current_student_id",
    currentTeacher:"afaq_current_teacher"
  };

  function read(key){
    try{return JSON.parse(localStorage.getItem(key)) || [];}catch(e){return [];}
  }

  function currentStudent(){
    try{return JSON.parse(localStorage.getItem(K.currentStudent)) || null;}catch(e){return null;}
  }

  function clean(v){return String(v || "").trim();}

  function studentId(){
    const st = currentStudent();
    return clean(st && (st.studentId || st.code || st.id));
  }

  function unreadNotifications(role,id){
    return read(K.notifications).filter(n =>
      !n.read &&
      (!role || !n.toRole || n.toRole === role) &&
      (!id || !n.toId || n.toId === id || n.toId === "admin")
    ).length;
  }

  function pendingSubscriptionRequests(){
    return read(K.subscriptionRequests).filter(r => (r.status || "قيد المراجعة") === "قيد المراجعة").length;
  }

  function pendingSubjectRequests(teacherCode){
    let arr = read(K.subjectRequests).filter(r => (r.status || "قيد المراجعة") === "قيد المراجعة");
    if(teacherCode) arr = arr.filter(r => r.teacherCode === teacherCode);
    return arr.length;
  }

  function scopedNewCount(key){
    const sid = studentId();
    return read(K[key]).filter(x => {
      const isForStudent = !x.studentId || x.studentId === sid || x.code === sid;
      const isNew = x.isNew !== false && x.read !== true && x.seen !== true;
      const isPublished = !x.status || x.status === "منشور" || x.status === "قيد المراجعة";
      return isForStudent && isNew && isPublished;
    }).length;
  }

  function messagesCount(role,id){
    return read(K.messages).filter(m =>
      !m.read &&
      (!role || !m.toRole || m.toRole === role) &&
      (!id || !m.toId || m.toId === id)
    ).length;
  }

  function setBadgeBySelector(selector,count){
    document.querySelectorAll(selector).forEach(el=>{
      let b = el.querySelector(".afaq-badge");
      if(!b){
        b = document.createElement("span");
        b.className = "afaq-badge";
        el.appendChild(b);
      }
      b.textContent = count;
      b.classList.toggle("show", Number(count) > 0);
    });
  }

  function setBadge(id,count){
    const el = document.getElementById(id);
    if(!el) return;
    let b = el.querySelector(".afaq-badge");
    if(!b){
      b = document.createElement("span");
      b.className = "afaq-badge";
      el.appendChild(b);
    }
    b.textContent = count;
    b.classList.toggle("show", Number(count) > 0);
  }

  function detectRole(){
    const path = location.pathname;
    if(path.includes("admin-") || path.includes("subscription-requests-management")) return "admin";
    if(path.includes("teacher-")) return "teacher";
    if(path.includes("parent-")) return "parent";
    if(path.includes("student-")) return "student";
    return "";
  }

  function currentTeacherCode(){
    try{
      const t = JSON.parse(localStorage.getItem(K.currentTeacher)) || {};
      return clean(t.teacherCode || t.code || t.id);
    }catch(e){return "";}
  }

  function updateBadges(){
    const role = detectRole();
    const sid = studentId();
    const teacherCode = currentTeacherCode();

    const counts = {
      adminNotifications: unreadNotifications("admin","admin"),
      studentNotifications: unreadNotifications("student",sid),
      parentNotifications: unreadNotifications("student",sid),
      teacherNotifications: unreadNotifications("teacher",teacherCode),
      subscriptionRequests: pendingSubscriptionRequests(),
      subjectRequests: pendingSubjectRequests(teacherCode),
      exams: scopedNewCount("exams"),
      assignments: scopedNewCount("assignments"),
      lessons: scopedNewCount("lessons"),
      results: scopedNewCount("results"),
      messagesStudent: messagesCount("student",sid),
      messagesParent: messagesCount("parent",sid),
      messagesTeacher: messagesCount("teacher",teacherCode),
      messagesAdmin: messagesCount("admin","admin")
    };

    setBadge("badgeNotifications", role==="admin"?counts.adminNotifications:role==="teacher"?counts.teacherNotifications:counts.studentNotifications);
    setBadge("badgeMessages", role==="admin"?counts.messagesAdmin:role==="teacher"?counts.messagesTeacher:counts.messagesStudent);
    setBadge("badgeSubscriptionRequests", counts.subscriptionRequests);
    setBadge("badgeSubjectRequests", counts.subjectRequests);
    setBadge("badgeExams", counts.exams);
    setBadge("badgeAssignments", counts.assignments);
    setBadge("badgeLessons", counts.lessons);
    setBadge("badgeResults", counts.results);

    setBadgeBySelector("[data-badge='notifications']", role==="admin"?counts.adminNotifications:role==="teacher"?counts.teacherNotifications:counts.studentNotifications);
    setBadgeBySelector("[data-badge='messages']", role==="admin"?counts.messagesAdmin:role==="teacher"?counts.messagesTeacher:counts.messagesStudent);
    setBadgeBySelector("[data-badge='subscriptionRequests']", counts.subscriptionRequests);
    setBadgeBySelector("[data-badge='subjectRequests']", counts.subjectRequests);
    setBadgeBySelector("[data-badge='exams']", counts.exams);
    setBadgeBySelector("[data-badge='assignments']", counts.assignments);
    setBadgeBySelector("[data-badge='lessons']", counts.lessons);
    setBadgeBySelector("[data-badge='results']", counts.results);
  }

  function markCollectionSeen(key){
    const arr = read(K[key]);
    arr.forEach(x => { x.read = true; x.seen = true; x.isNew = false; });
    localStorage.setItem(K[key], JSON.stringify(arr));
    updateBadges();
  }

  window.AfaqBadges = {updateBadges,markCollectionSeen};

  const oldSet = localStorage.setItem;
  const oldRemove = localStorage.removeItem;
  localStorage.setItem = function(key,value){
    oldSet.apply(this,arguments);
    if(String(key).startsWith("afaq_")) setTimeout(updateBadges,0);
  };
  localStorage.removeItem = function(key){
    oldRemove.apply(this,arguments);
    if(String(key).startsWith("afaq_")) setTimeout(updateBadges,0);
  };

  document.addEventListener("DOMContentLoaded",updateBadges);
  window.addEventListener("storage",updateBadges);
  window.addEventListener("afaqDataUpdated",updateBadges);
})();
