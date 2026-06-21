/* AFAQ AUTO COUNTERS
   يحدث العدادات تلقائياً في كل اللوحات بعد الإضافة أو الحذف أو التفريغ.
   ارفعه داخل: js/afaq-auto-stats.js
*/
(function(){
  const KEYS = {
    students:"afaq_students",
    teachers:"afaq_teachers",
    subjects:"afaq_subjects",
    lessons:"afaq_lessons",
    files:"afaq_files",
    exams:"afaq_exams",
    assignments:"afaq_assignments",
    attendance:"afaq_attendance",
    results:"afaq_results",
    messages:"afaq_messages",
    notifications:"afaq_notifications",
    subscriptionRequests:"afaq_subscription_requests",
    subjectRequests:"afaq_subject_requests"
  };

  function read(key){
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch(e){ return []; }
  }

  function currentStudent(){
    try { return JSON.parse(localStorage.getItem("afaq_current_student")) || null; }
    catch(e){ return null; }
  }

  function normalizeStudentId(st){
    if(!st) return "";
    return String(st.studentId || st.code || st.id || "").trim();
  }

  function count(key){
    return read(KEYS[key] || key).length;
  }

  function studentScopedCount(key){
    const st = currentStudent();
    const sid = normalizeStudentId(st);
    const arr = read(KEYS[key] || key);
    if(!sid) return arr.length;
    return arr.filter(x => !x.studentId || x.studentId === sid || x.code === sid).length;
  }

  function unreadNotifications(role,id){
    const arr = read(KEYS.notifications);
    return arr.filter(n => 
      (!role || n.toRole === role || !n.toRole) &&
      (!id || n.toId === id || n.toId === "admin" || !n.toId) &&
      !n.read
    ).length;
  }

  function presentCount(){
    return read(KEYS.attendance).filter(x => String(x.status || "").includes("حاضر")).length;
  }

  function absentCount(){
    return read(KEYS.attendance).filter(x => String(x.status || "").includes("غائب")).length;
  }

  function attendanceRate(){
    const p = presentCount();
    const a = absentCount();
    const total = p + a;
    if(!total) return "0%";
    return Math.round((p / total) * 100) + "%";
  }

  function averageScore(){
    const arr = read(KEYS.results);
    const scores = arr.map(r => {
      const s = Number(r.score || 0);
      const t = Number(r.total || 100);
      return t ? Math.round((s / t) * 100) : 0;
    }).filter(v => !isNaN(v));
    if(!scores.length) return "0%";
    return Math.round(scores.reduce((a,b)=>a+b,0) / scores.length) + "%";
  }

  function setText(id,value){
    const el = document.getElementById(id);
    if(el) el.textContent = value;
  }

  function setAll(selector,value){
    document.querySelectorAll(selector).forEach(el => el.textContent = value);
  }

  function updateCounters(){
    const st = currentStudent();
    const sid = normalizeStudentId(st);

    const data = {
      students: count("students"),
      teachers: count("teachers"),
      subjects: count("subjects"),
      lessons: count("lessons"),
      files: count("files"),
      exams: count("exams"),
      assignments: count("assignments"),
      attendance: count("attendance"),
      present: presentCount(),
      absent: absentCount(),
      attendanceRate: attendanceRate(),
      results: count("results"),
      messages: count("messages"),
      notifications: count("notifications"),
      subscriptionRequests: count("subscriptionRequests"),
      subjectRequests: count("subjectRequests"),
      unreadAdmin: unreadNotifications("admin","admin"),
      unreadStudent: unreadNotifications("student",sid),
      averageScore: averageScore(),
      studentLessons: studentScopedCount("lessons"),
      studentExams: studentScopedCount("exams"),
      studentAssignments: studentScopedCount("assignments"),
      studentAttendance: studentScopedCount("attendance"),
      studentResults: studentScopedCount("results"),
      studentMessages: studentScopedCount("messages")
    };

    Object.keys(data).forEach(k => {
      setText(k + "Count", data[k]);
      setAll("[data-count='" + k + "']", data[k]);
    });

    // أسماء شائعة قد تكون مستخدمة في صفحاتك القديمة
    setText("materialsCount", data.subjects);
    setText("subjectsCount", data.subjects);
    setText("studentsCount", data.students);
    setText("teachersCount", data.teachers);
    setText("lessonsCount", data.lessons);
    setText("examsCount", data.exams);
    setText("assignmentsCount", data.assignments);
    setText("attendanceCount", data.attendance);
    setText("resultsCount", data.results);
    setText("messagesCount", data.messages);
    setText("notificationsCount", data.notifications);
    setText("subscriptionRequestsCount", data.subscriptionRequests);
    setText("subjectRequestsCount", data.subjectRequests);
    setText("avgScore", data.averageScore);
    setText("attendanceRate", data.attendanceRate);
  }

  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  const originalClear = localStorage.clear;

  localStorage.setItem = function(key,value){
    originalSetItem.apply(this,arguments);
    if(String(key).startsWith("afaq_")) setTimeout(updateCounters,0);
  };

  localStorage.removeItem = function(key){
    originalRemoveItem.apply(this,arguments);
    if(String(key).startsWith("afaq_")) setTimeout(updateCounters,0);
  };

  localStorage.clear = function(){
    originalClear.apply(this,arguments);
    setTimeout(updateCounters,0);
  };

  window.addEventListener("storage", updateCounters);
  window.addEventListener("afaqDataUpdated", updateCounters);
  document.addEventListener("DOMContentLoaded", updateCounters);

  window.AfaqStats = {
    updateCounters,
    read,
    count,
    attendanceRate,
    averageScore
  };
})();
