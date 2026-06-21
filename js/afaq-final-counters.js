/* AFAQ FINAL AUTO COUNTERS + BADGES */
(function(){
  function updateCounters(){
    if(!window.AfaqCentral) return;
    const c = AfaqCentral.counts();
    const map = {
      students:c.students, teachers:c.teachers, subjects:c.subjects,
      lessons:c.lessons, exams:c.exams, assignments:c.assignments,
      attendance:c.attendance, results:c.results, notifications:c.notifications,
      messages:c.messages, subscriptionRequests:c.subscriptions,
      subjectRequests:c.subjectRequests
    };

    document.querySelectorAll("[data-count]").forEach(el => {
      const key = el.getAttribute("data-count");
      if(key in map) el.textContent = map[key];
    });

    const st = AfaqCentral.currentStudent();
    if(st){
      const sid = AfaqCentral.studentId(st);
      const studentNot = AfaqCentral.notificationsFor("student", sid).filter(n=>!n.read).length;
      document.querySelectorAll("[data-student-badge='notifications']").forEach(el=>el.textContent=studentNot);
    }

    const t = AfaqCentral.currentTeacher();
    if(t){
      const tc = AfaqCentral.teacherCode(t);
      const teacherNot = AfaqCentral.notificationsFor("teacher", tc).filter(n=>!n.read).length;
      document.querySelectorAll("[data-teacher-badge='notifications']").forEach(el=>el.textContent=teacherNot);
    }
  }

  document.addEventListener("DOMContentLoaded", updateCounters);
  window.addEventListener("afaqDataUpdated", updateCounters);
  window.addEventListener("storage", updateCounters);
  setInterval(updateCounters, 1500);

  window.AfaqFinalCounters = {update:updateCounters};
})();
