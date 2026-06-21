/* AFAQ OLD NAMES BRIDGE
   يجعل الملفات القديمة تستخدم النظام النهائي بدون كسر الروابط
*/
(function(){
  function ready(){
    if(!window.AfaqCentral){setTimeout(ready,50);return;}

    window.AfaqSync = window.AfaqCentral;
    window.AfaqFullSync = window.AfaqCentral;

    window.AfaqTeacherSync = {
      ...window.AfaqCentral,
      addLesson: window.AfaqCentral.addLesson,
      addExam: window.AfaqCentral.addExam,
      addAssignment: window.AfaqCentral.addAssignment,
      addAttendanceSession: window.AfaqCentral.addAttendanceSession,
      addFinalResult: window.AfaqCentral.addFinalResult,
      studentItems: window.AfaqCentral.itemsForStudent,
      submitObjective: window.AfaqCentral.submitWork,
      registerAttendance: window.AfaqCentral.registerAttendance,
      teacherStudents: window.AfaqCentral.teacherStudents,
      currentTeacher: window.AfaqCentral.currentTeacher,
      currentStudent: window.AfaqCentral.currentStudent
    };

    window.AfaqMessages = window.AfaqMessages || {
      read: window.AfaqCentral.read,
      write: window.AfaqCentral.write,
      addMessage:function(data){
        const a = window.AfaqCentral.list("messages");
        const m = {...data,id:window.AfaqCentral.id("msg"),read:false,createdAt:window.AfaqCentral.now()};
        a.unshift(m);
        window.AfaqCentral.save("messages",a);
        window.AfaqCentral.addNotification(m.toRole,m.toId,"رسالة جديدة","وصلتك رسالة من "+(m.fromName||m.fromRole),"رسائل",m.subjectName||m.subject);
        return m;
      }
    };
  }
  ready();
})();
