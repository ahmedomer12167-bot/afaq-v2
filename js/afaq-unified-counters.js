/* =========================================================
   AFAQ READY UNIFIED COUNTERS - ALL PANELS
   عدادات موحدة للصفحة الرئيسية + المدير + المدرس + الطالب + ولي الأمر
   ========================================================= */
(function(){
  const MAP = {
    students:"afaq_students",
    teachers:"afaq_teachers",
    subjects:"afaq_subjects",
    subscriptionRequests:"afaq_subscription_requests",
    subjectRequests:"afaq_subject_requests",
    lessons:"afaq_lessons",
    files:"afaq_files",
    exams:"afaq_exams",
    assignments:"afaq_assignments",
    attendance:"afaq_attendance",
    attendanceSessions:"afaq_attendance_sessions",
    results:"afaq_results",
    messages:"afaq_messages",
    notifications:"afaq_notifications",
    examSubmissions:"afaq_exam_submissions",
    assignmentSubmissions:"afaq_assignment_submissions"
  };

  function read(key){
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch(e){ return []; }
  }

  function currentStudent(){
    try { return JSON.parse(localStorage.getItem("afaq_current_student")) || null; }
    catch(e){ return null; }
  }

  function currentTeacher(){
    try { return JSON.parse(localStorage.getItem("afaq_current_teacher")) || null; }
    catch(e){ return null; }
  }

  function sid(){
    const st = currentStudent();
    return st ? String(st.studentId || st.code || st.id || "").trim() : "";
  }

  function tcode(){
    const t = currentTeacher();
    return t ? String(t.teacherCode || t.code || t.id || "").trim() : "";
  }

  function scode(){
    const t = currentTeacher();
    return t ? String(t.subjectCode || "").trim() : "";
  }

  function tsubject(){
    const t = currentTeacher();
    return t ? String(t.subject || "").trim() : "";
  }

  function count(name){
    return read(MAP[name] || name).length;
  }

  function activeSubscriptions(){
    return read(MAP.students).filter(s => String(s.subscriptionStatus || "").trim() === "مفعل").length;
  }

  function pendingSubscriptionRequests(){
    return read(MAP.subscriptionRequests).filter(r => String(r.status || "قيد المراجعة") === "قيد المراجعة").length;
  }

  function pendingSubjectRequests(){
    const code = tcode();
    let arr = read(MAP.subjectRequests).filter(r => String(r.status || "قيد المراجعة") === "قيد المراجعة");
    if(code) arr = arr.filter(r => r.teacherCode === code);
    return arr.length;
  }

  function teacherScoped(name){
    const code = tcode();
    const subCode = scode();
    const sub = tsubject();
    let arr = read(MAP[name] || name);
    if(!code && !subCode && !sub) return arr;
    return arr.filter(x =>
      x.teacherCode === code ||
      x.subjectCode === subCode ||
      x.subject === sub
    );
  }

  function studentScoped(name){
    const id = sid();
    const st = currentStudent();
    const subjects = st && Array.isArray(st.subjects) ? st.subjects : [];
    let arr = read(MAP[name] || name);

    if(name === "lessons" || name === "exams" || name === "assignments"){
      return arr.filter(x =>
        (!x.status || x.status === "منشور") &&
        (!x.grade || !st || x.grade === st.grade) &&
        (!x.subject || subjects.includes(x.subject))
      );
    }

    if(!id) return arr;

    return arr.filter(x =>
      x.studentId === id ||
      x.code === id ||
      !x.studentId
    );
  }

  function presentCount(arr){
    return arr.filter(x => String(x.status || "").includes("حاضر")).length;
  }

  function absentCount(arr){
    return arr.filter(x => String(x.status || "").includes("غائب")).length;
  }

  function rate(p,a){
    const total = p + a;
    return total ? Math.round((p / total) * 100) + "%" : "0%";
  }

  function avgResults(results){
    const arr = results.map(r => {
      const s = Number(r.score || 0);
      const t = Number(r.total || 100);
      return t ? Math.round((s / t) * 100) : 0;
    }).filter(v => !isNaN(v));
    if(!arr.length) return "0%";
    return Math.round(arr.reduce((a,b)=>a+b,0) / arr.length) + "%";
  }

  function unread(role,id){
    return read(MAP.notifications).filter(n =>
      !n.read &&
      (!role || !n.toRole || n.toRole === role) &&
      (!id || !n.toId || n.toId === id || n.toId === "admin")
    ).length;
  }

  function unreadMessages(role,id){
    return read(MAP.messages).filter(m =>
      !m.read &&
      (!role || !m.toRole || m.toRole === role) &&
      (!id || !m.toId || m.toId === id || m.toId === "admin")
    ).length;
  }

  function buildCounters(){
    const st = currentStudent();
    const studentId = sid();
    const teacherCode = tcode();

    const allAttendance = read(MAP.attendance);
    const allResults = read(MAP.results);

    const studentAttendance = studentScoped("attendance");
    const studentResults = studentScoped("results");

    const teacherAttendance = teacherScoped("attendance");
    const teacherResults = teacherScoped("results");

    const pAll = presentCount(allAttendance);
    const aAll = absentCount(allAttendance);

    const pStudent = presentCount(studentAttendance);
    const aStudent = absentCount(studentAttendance);

    const pTeacher = presentCount(teacherAttendance);
    const aTeacher = absentCount(teacherAttendance);

    const subjectsOfStudent = st && Array.isArray(st.subjects) ? st.subjects.length : 0;

    return {
      homeStudents: count("students"),
      homeTeachers: count("teachers"),
      homeSubjects: count("subjects"),
      homeSubscriptions: activeSubscriptions(),

      students: count("students"),
      teachers: count("teachers"),
      subjects: count("subjects"),
      subscriptions: activeSubscriptions(),
      subscriptionRequests: pendingSubscriptionRequests(),
      subjectRequests: count("subjectRequests"),
      lessons: count("lessons"),
      files: count("files"),
      exams: count("exams"),
      assignments: count("assignments"),
      results: count("results"),
      messages: count("messages"),
      notifications: count("notifications"),
      attendance: count("attendance"),
      attendanceSessions: count("attendanceSessions"),
      present: pAll,
      absent: aAll,
      attendanceRate: rate(pAll,aAll),
      averageScore: avgResults(allResults),
      unreadAdmin: unread("admin","admin"),
      unreadAdminMessages: unreadMessages("admin","admin"),

      teacherLessons: teacherScoped("lessons").length,
      teacherExams: teacherScoped("exams").length,
      teacherAssignments: teacherScoped("assignments").length,
      teacherResults: teacherResults.length,
      teacherAttendance: teacherAttendance.length,
      teacherPresent: pTeacher,
      teacherAbsent: aTeacher,
      teacherAttendanceRate: rate(pTeacher,aTeacher),
      teacherAverageScore: avgResults(teacherResults),
      teacherSubjectRequests: pendingSubjectRequests(),
      teacherNotifications: unread("teacher",teacherCode),
      teacherMessages: unreadMessages("teacher",teacherCode),

      studentSubjects: subjectsOfStudent,
      studentLessons: studentScoped("lessons").length,
      studentExams: studentScoped("exams").length,
      studentAssignments: studentScoped("assignments").length,
      studentResults: studentResults.length,
      studentAttendance: studentAttendance.length,
      studentPresent: pStudent,
      studentAbsent: aStudent,
      studentAttendanceRate: rate(pStudent,aStudent),
      studentAverageScore: avgResults(studentResults),
      studentNotifications: unread("student",studentId),
      studentMessages: unreadMessages("student",studentId),

      parentLessons: studentScoped("lessons").length,
      parentExams: studentScoped("exams").length,
      parentAssignments: studentScoped("assignments").length,
      parentResults: studentResults.length,
      parentAttendance: studentAttendance.length,
      parentPresent: pStudent,
      parentAbsent: aStudent,
      parentAttendanceRate: rate(pStudent,aStudent),
      parentAverageScore: avgResults(studentResults),
      parentNotifications: unread("student",studentId),
      parentMessages: unreadMessages("parent",studentId),

      examSubmissions: count("examSubmissions"),
      assignmentSubmissions: count("assignmentSubmissions")
    };
  }

  function setText(id,value){
    const el = document.getElementById(id);
    if(el) el.textContent = value;
  }

  function updateAllCounters(){
    const counters = buildCounters();

    Object.keys(counters).forEach(k => {
      document.querySelectorAll("[data-count='" + k + "']").forEach(el => {
        el.textContent = counters[k];
      });
      setText(k + "Count", counters[k]);
    });

    setText("studentsCount", counters.students);
    setText("teachersCount", counters.teachers);
    setText("subjectsCount", counters.subjects);
    setText("materialsCount", counters.subjects);
    setText("subscriptionsCount", counters.subscriptions);
    setText("lessonsCount", counters.lessons);
    setText("examsCount", counters.exams);
    setText("assignmentsCount", counters.assignments);
    setText("resultsCount", counters.results);
    setText("messagesCount", counters.messages);
    setText("notificationsCount", counters.notifications);
    setText("subscriptionRequestsCount", counters.subscriptionRequests);
    setText("subjectRequestsCount", counters.subjectRequests);
    setText("attendanceCount", counters.attendance);
    setText("presentCount", counters.present);
    setText("absentCount", counters.absent);
    setText("attendanceRate", counters.attendanceRate);
    setText("avgScore", counters.averageScore);

    setText("homeStudentsCount", counters.homeStudents);
    setText("homeTeachersCount", counters.homeTeachers);
    setText("homeSubjectsCount", counters.homeSubjects);
    setText("homeSubscriptionsCount", counters.homeSubscriptions);

    return counters;
  }

  const oldSetItem = localStorage.setItem;
  const oldRemoveItem = localStorage.removeItem;
  const oldClear = localStorage.clear;

  localStorage.setItem = function(key,value){
    oldSetItem.apply(this,arguments);
    if(String(key).startsWith("afaq_")) setTimeout(updateAllCounters,0);
  };

  localStorage.removeItem = function(key){
    oldRemoveItem.apply(this,arguments);
    if(String(key).startsWith("afaq_")) setTimeout(updateAllCounters,0);
  };

  localStorage.clear = function(){
    oldClear.apply(this,arguments);
    setTimeout(updateAllCounters,0);
  };

  document.addEventListener("DOMContentLoaded", updateAllCounters);
  window.addEventListener("storage", updateAllCounters);
  window.addEventListener("afaqDataUpdated", updateAllCounters);
  setInterval(updateAllCounters, 1000);

  window.AfaqCounters = { updateAllCounters, buildCounters, read, count };
})();
