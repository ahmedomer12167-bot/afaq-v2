/* =========================================================
   AFAQ ADMIN CONTROL + STUDENT REGISTRY
   تحكم المدير الكامل + سجل الطلبة المفصل
   ========================================================= */
(function(){
  const KEYS = {
    students:"afaq_students",
    teachers:"afaq_teachers",
    subjects:"afaq_subjects",
    subscriptions:"afaq_subscription_requests",
    subjectRequests:"afaq_subject_requests",
    lessons:"afaq_lessons",
    exams:"afaq_exams",
    assignments:"afaq_assignments",
    attendance:"afaq_attendance",
    results:"afaq_results",
    notifications:"afaq_notifications",
    messages:"afaq_messages",
    examSubs:"afaq_exam_submissions",
    assignmentSubs:"afaq_assignment_submissions",
    leaderboard:"afaq_leaderboard"
  };

  function read(key){
    try{return JSON.parse(localStorage.getItem(key)) || [];}catch(e){return [];}
  }

  function write(key,value){
    localStorage.setItem(key, JSON.stringify(value || []));
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }

  function clean(v){return String(v || "").trim();}

  function now(){return new Date().toLocaleString("ar");}

  function getPlatformName(){
    return localStorage.getItem("afaq_platform_name") || "آفاق التعليمية";
  }

  function setPlatformName(name){
    localStorage.setItem("afaq_platform_name", clean(name) || "آفاق التعليمية");
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }

  function getAdminCode(){
    return localStorage.getItem("afaq_admin_code") || localStorage.getItem("adminCode") || "111";
  }

  function setAdminCode(code){
    localStorage.setItem("afaq_admin_code", clean(code));
    localStorage.setItem("adminCode", clean(code));
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }

  function clearKey(key){
    write(key, []);
  }

  function clearStudents(){clearKey(KEYS.students);}
  function clearTeachers(){clearKey(KEYS.teachers);}
  function clearSubjects(){clearKey(KEYS.subjects);}
  function clearSubscriptions(){clearKey(KEYS.subscriptions);}
  function clearSubjectRequests(){clearKey(KEYS.subjectRequests);}

  function clearOldOperationalData(){
    [
      KEYS.lessons, KEYS.exams, KEYS.assignments, KEYS.attendance,
      KEYS.results, KEYS.notifications, KEYS.messages,
      KEYS.examSubs, KEYS.assignmentSubs, KEYS.leaderboard,
      KEYS.subjectRequests, KEYS.subscriptions
    ].forEach(clearKey);
  }

  function resetPlatformData(){
    Object.values(KEYS).forEach(clearKey);
    localStorage.removeItem("afaq_current_student");
    localStorage.removeItem("afaq_current_teacher");
    localStorage.removeItem("afaq_current_parent");
    localStorage.removeItem("afaq_current_subject");
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }

  function normalizeSubject(v){
    const x = clean(v).replaceAll("أ","ا").replaceAll("إ","ا");
    const map = {
      "احياء":"الأحياء","الاحياء":"الأحياء",
      "كيمياء":"الكيمياء","فيزياء":"الفيزياء",
      "رياضيات":"الرياضيات","انكليزي":"الإنكليزي","الانكليزي":"الإنكليزي",
      "عربي":"العربي","اسلامية":"الإسلامية","الاسلامية":"الإسلامية"
    };
    return map[x] || clean(v);
  }

  function studentId(st){
    return clean(st && (st.studentId || st.code || st.studentCode || st.id));
  }

  function studentsBySubject(subjectName){
    const sname = normalizeSubject(subjectName);
    return read(KEYS.students).filter(st => {
      const subs = Array.isArray(st.subjects) ? st.subjects.map(normalizeSubject) : [];
      return subs.includes(sname);
    });
  }

  function attendanceStats(st, subjectName){
    const sid = studentId(st);
    const sname = normalizeSubject(subjectName);
    const rec = read(KEYS.attendance).filter(r =>
      (r.studentId === sid || r.code === sid) &&
      (!subjectName || normalizeSubject(r.subject) === sname)
    );
    return {
      present: rec.filter(r => String(r.status || "").includes("حاضر")).length,
      absent: rec.filter(r => String(r.status || "").includes("غائب")).length,
      total: rec.length
    };
  }

  function examResults(st, subjectName){
    const sid = studentId(st);
    const sname = normalizeSubject(subjectName);
    return read(KEYS.results).filter(r =>
      (r.studentId === sid || r.code === sid) &&
      (!subjectName || normalizeSubject(r.subject) === sname) &&
      !String(r.title || r.type || "").includes("نهائي")
    );
  }

  function assignmentResults(st, subjectName){
    const sid = studentId(st);
    const sname = normalizeSubject(subjectName);
    return read(KEYS.assignmentSubs).filter(r =>
      (r.studentId === sid || r.code === sid) &&
      (!subjectName || normalizeSubject(r.subject) === sname)
    );
  }

  function finalResult(st, subjectName){
    const sid = studentId(st);
    const sname = normalizeSubject(subjectName);
    return read(KEYS.results).find(r =>
      (r.studentId === sid || r.code === sid) &&
      (!subjectName || normalizeSubject(r.subject) === sname) &&
      (r.type === "نهائي" || String(r.title || "").includes("نهائي"))
    );
  }

  function statsCounts(){
    const obj = {};
    Object.keys(KEYS).forEach(name => obj[name] = read(KEYS[name]).length);
    return obj;
  }

  window.AfaqAdminTools = {
    KEYS, read, write, clean, now,
    getPlatformName, setPlatformName,
    getAdminCode, setAdminCode,
    clearStudents, clearTeachers, clearSubjects, clearSubscriptions, clearSubjectRequests,
    clearOldOperationalData, resetPlatformData,
    normalizeSubject, studentId,
    studentsBySubject, attendanceStats, examResults, assignmentResults, finalResult,
    statsCounts
  };
})();
