/* =========================================================
   AFAQ CENTRAL DATA SYSTEM - FINAL VERSION
   مصدر بيانات موحد لكل لوحات آفاق التعليمية
   المدير + المدرس + الطالب + ولي الأمر
   ========================================================= */
(function(){
  const STORE = {
    students:"afaq_students",
    teachers:"afaq_teachers",
    subjects:"afaq_subjects",
    subscriptions:"afaq_subscription_requests",
    subjectRequests:"afaq_subject_requests",
    lessons:"afaq_lessons",
    exams:"afaq_exams",
    assignments:"afaq_assignments",
    attendanceSessions:"afaq_attendance_sessions",
    attendance:"afaq_attendance",
    results:"afaq_results",
    notifications:"afaq_notifications",
    messages:"afaq_messages",
    leaderboard:"afaq_leaderboard",
    examSubmissions:"afaq_exam_submissions",
    assignmentSubmissions:"afaq_assignment_submissions"
  };

  function read(key){
    try{return JSON.parse(localStorage.getItem(key)) || [];}catch(e){return [];}
  }

  function write(key,value){
    localStorage.setItem(key, JSON.stringify(value || []));
    window.dispatchEvent(new Event("afaqDataUpdated"));
    window.dispatchEvent(new Event("storage"));
  }

  function clean(v){return String(v || "").trim();}
  function now(){return new Date().toLocaleString("ar");}
  function id(prefix){return prefix + "-" + Date.now() + "-" + Math.floor(Math.random()*9999);}

  function normalizeGrade(v){
    let x = clean(v).replaceAll("أ","ا").replaceAll("إ","ا").replaceAll("ى","ي").replaceAll("ة","ه");
    const map = {
      "اول متوسط":"أول متوسط","الاول متوسط":"أول متوسط",
      "ثاني متوسط":"ثاني متوسط","الثاني متوسط":"ثاني متوسط",
      "ثالث متوسط":"ثالث متوسط","الثالث متوسط":"ثالث متوسط",
      "رابع علمي":"رابع إعدادي","الرابع العلمي":"رابع إعدادي","رابع اعدادي":"رابع إعدادي",
      "خامس علمي":"خامس إعدادي","الخامس العلمي":"خامس إعدادي","خامس اعدادي":"خامس إعدادي",
      "سادس علمي":"سادس إعدادي","السادس العلمي":"سادس إعدادي","سادس اعدادي":"سادس إعدادي"
    };
    return map[x] || clean(v);
  }

  function normalizeSubject(v){
    let x = clean(v).replaceAll("أ","ا").replaceAll("إ","ا");
    const map = {
      "احياء":"الأحياء","الاحياء":"الأحياء",
      "كيمياء":"الكيمياء","الكيمياء":"الكيمياء",
      "فيزياء":"الفيزياء","الفيزياء":"الفيزياء",
      "رياضيات":"الرياضيات","الرياضيات":"الرياضيات",
      "انكليزي":"الإنكليزي","الانكليزي":"الإنكليزي",
      "عربي":"العربي","العربي":"العربي",
      "اسلامية":"الإسلامية","الاسلامية":"الإسلامية"
    };
    return map[x] || clean(v);
  }

  function studentId(st){return clean(st && (st.studentId || st.code || st.studentCode || st.id));}
  function teacherCode(t){return clean(t && (t.teacherCode || t.code || t.id));}
  function parentId(st){return clean(st && (st.parentCode || st.parentPhone || st.parentName || st.guardianName));}

  function currentStudent(){try{return JSON.parse(localStorage.getItem("afaq_current_student")) || null;}catch(e){return null;}}
  function currentTeacher(){try{return JSON.parse(localStorage.getItem("afaq_current_teacher")) || null;}catch(e){return null;}}
  function currentParent(){try{return JSON.parse(localStorage.getItem("afaq_current_parent")) || null;}catch(e){return null;}}
  function setCurrentStudent(st){localStorage.setItem("afaq_current_student", JSON.stringify(st)); broadcast();}
  function setCurrentTeacher(t){localStorage.setItem("afaq_current_teacher", JSON.stringify(t)); broadcast();}

  function broadcast(){
    window.dispatchEvent(new Event("afaqDataUpdated"));
    window.dispatchEvent(new Event("storage"));
  }

  function list(name){return read(STORE[name]);}
  function save(name,value){write(STORE[name], value);}

  function normalizeAll(){
    const subjects = list("subjects").map(s => ({
      ...s,
      id: s.id || id("subject"),
      name: normalizeSubject(s.name || s.subject || s.subjectName),
      subject: normalizeSubject(s.name || s.subject || s.subjectName),
      grade: normalizeGrade(s.grade || s.stage || s.className)
    }));
    save("subjects", subjects);

    const students = list("students").map(st => ({
      ...st,
      id: st.id || "student-" + (st.code || st.studentId || Date.now()),
      code: st.code || st.studentCode || st.studentId,
      studentId: st.studentId || st.code || st.studentCode,
      name: st.name || st.studentName || st.fullName,
      studentName: st.studentName || st.name || st.fullName,
      grade: normalizeGrade(st.grade || st.stage || st.className),
      subjects: Array.isArray(st.subjects) ? st.subjects.map(normalizeSubject) : [],
      subjectCodes: Array.isArray(st.subjectCodes) ? st.subjectCodes.map(clean) : [],
      teacherCodes: Array.isArray(st.teacherCodes) ? st.teacherCodes.map(clean) : []
    }));
    save("students", students);

    const teachers = list("teachers").map(t => ({
      ...t,
      teacherCode: t.teacherCode || t.code || t.id,
      code: t.code || t.teacherCode || t.id,
      name: t.name || t.teacherName || t.fullName,
      teacherName: t.teacherName || t.name || t.fullName,
      subject: normalizeSubject(t.subject || t.subjectName),
      grade: normalizeGrade(t.grade || t.stage || t.className)
    }));
    save("teachers", teachers);

    refreshLeaderboard();
  }

  function freshStudent(){
    const cur = currentStudent();
    if(!cur) return null;
    const st = list("students").find(s => studentId(s) === studentId(cur));
    if(st) setCurrentStudent(st);
    return st || cur;
  }

  function freshTeacher(){
    const cur = currentTeacher();
    if(!cur) return null;
    const t = list("teachers").find(x => teacherCode(x) === teacherCode(cur));
    if(t) setCurrentTeacher(t);
    return t || cur;
  }

  function visibleSubjectsForStudent(st){
    st = st || freshStudent();
    if(!st) return [];
    const grade = normalizeGrade(st.grade);
    return list("subjects").filter(s => !grade || !s.grade || normalizeGrade(s.grade) === grade);
  }

  function studentJoinedSubject(st, subject){
    st = st || freshStudent();
    if(!st || !subject) return false;
    const sname = normalizeSubject(subject.name || subject.subject);
    const scode = clean(subject.subjectCode);
    const subs = Array.isArray(st.subjects) ? st.subjects.map(normalizeSubject) : [];
    const codes = Array.isArray(st.subjectCodes) ? st.subjectCodes.map(clean) : [];
    return subs.includes(sname) || (scode && codes.includes(scode));
  }

  function subjectStudents(subjectName){
    const sname = normalizeSubject(subjectName);
    return list("students").filter(st => (st.subjects || []).map(normalizeSubject).includes(sname));
  }

  function teacherStudents(teacher){
    teacher = teacher || freshTeacher();
    if(!teacher) return [];
    const subject = normalizeSubject(teacher.subject);
    const grade = normalizeGrade(teacher.grade);
    return list("students").filter(st =>
      normalizeGrade(st.grade) === grade &&
      (st.subjects || []).map(normalizeSubject).includes(subject)
    );
  }

  function addNotification(toRole,toId,title,body,type,subject){
    const a = list("notifications");
    a.unshift({
      id:id("not"),
      toRole:clean(toRole),
      toId:clean(toId),
      title:clean(title),
      body:clean(body),
      type:clean(type),
      subject:normalizeSubject(subject),
      read:false,
      createdAt:now()
    });
    save("notifications", a);
  }

  function notifySubjectStudents(subject,title,body,type){
    subjectStudents(subject).forEach(st => addNotification("student", studentId(st), title, body, type, subject));
    addNotification("admin", "admin", title, body, type, subject);
  }

  function notificationsFor(role,id,subject){
    return list("notifications").filter(n =>
      n.toRole === role &&
      (!id || !n.toId || n.toId === id || n.toId === "all") &&
      (!subject || normalizeSubject(n.subject) === normalizeSubject(subject))
    );
  }

  function clearNotifications(role,id,subject){
    const keep = list("notifications").filter(n =>
      !(n.toRole === role &&
      (!id || !n.toId || n.toId === id || n.toId === "all") &&
      (!subject || normalizeSubject(n.subject) === normalizeSubject(subject)))
    );
    save("notifications", keep);
  }

  function submitSubjectRequest(subjectId, subjectCode){
    const st = freshStudent();
    if(!st) throw Error("سجل الدخول كطالب أولاً");
    const subject = list("subjects").find(s => String(s.id) === String(subjectId));
    if(!subject) throw Error("المادة غير موجودة");
    if(clean(subject.subjectCode) !== clean(subjectCode)) throw Error("كود المادة غير صحيح");
    if(studentJoinedSubject(st, subject)) throw Error("أنت مسجل في هذه المادة مسبقاً");

    const exists = list("subjectRequests").find(r =>
      r.studentId === studentId(st) &&
      normalizeSubject(r.subject) === normalizeSubject(subject.name || subject.subject) &&
      r.status === "قيد المراجعة"
    );
    if(exists) throw Error("لديك طلب قيد المراجعة");

    const req = {
      id:id("subjectreq"),
      status:"قيد المراجعة",
      studentId:studentId(st),
      studentCode:studentId(st),
      studentName:st.name || st.studentName,
      parentName:st.parentName || st.guardianName,
      grade:normalizeGrade(st.grade),
      subject:normalizeSubject(subject.name || subject.subject),
      subjectCode:clean(subject.subjectCode),
      teacherCode:clean(subject.teacherCode),
      teacherName:subject.teacherName || "",
      createdAt:now()
    };

    const a = list("subjectRequests");
    a.unshift(req);
    save("subjectRequests", a);
    addNotification("teacher", req.teacherCode, "طلب دخول مادة", "طلب الطالب " + req.studentName + " دخول مادة " + req.subject, "طلبات المواد", req.subject);
    addNotification("admin", "admin", "طلب دخول مادة", "طلب جديد من " + req.studentName + " لدخول مادة " + req.subject, "طلبات المواد", req.subject);
    return req;
  }

  function approveSubjectRequest(requestId){
    const reqs = list("subjectRequests");
    const req = reqs.find(r => r.id === requestId);
    if(!req) throw Error("الطلب غير موجود");
    req.status = "مقبول";
    req.approvedAt = now();
    save("subjectRequests", reqs);

    const students = list("students");
    const st = students.find(s => studentId(s) === clean(req.studentId));
    if(!st) throw Error("الطالب غير موجود");

    st.subjects = Array.isArray(st.subjects) ? st.subjects : [];
    if(!st.subjects.map(normalizeSubject).includes(normalizeSubject(req.subject))) st.subjects.push(normalizeSubject(req.subject));

    st.subjectCodes = Array.isArray(st.subjectCodes) ? st.subjectCodes : [];
    if(req.subjectCode && !st.subjectCodes.map(clean).includes(clean(req.subjectCode))) st.subjectCodes.push(clean(req.subjectCode));

    st.teacherCodes = Array.isArray(st.teacherCodes) ? st.teacherCodes : [];
    if(req.teacherCode && !st.teacherCodes.map(clean).includes(clean(req.teacherCode))) st.teacherCodes.push(clean(req.teacherCode));

    save("students", students);
    if(studentId(currentStudent()) === studentId(st)) setCurrentStudent(st);
    addNotification("student", studentId(st), "تم قبول دخول المادة", "تم قبولك في مادة " + req.subject, "طلبات المواد", req.subject);
    return st;
  }

  function rejectSubjectRequest(requestId,note){
    const reqs = list("subjectRequests");
    const req = reqs.find(r => r.id === requestId);
    if(!req) throw Error("الطلب غير موجود");
    req.status = "مرفوض";
    req.note = clean(note);
    req.rejectedAt = now();
    save("subjectRequests", reqs);
    addNotification("student", req.studentId, "تم رفض دخول المادة", "تم رفض طلبك في مادة " + req.subject, "طلبات المواد", req.subject);
  }

  function teacherBase(subject){
    const t = freshTeacher();
    return {
      id:id("item"),
      subject:normalizeSubject(subject || (t && t.subject)),
      grade:normalizeGrade(t && t.grade),
      teacherCode:teacherCode(t),
      teacherName:(t && (t.name || t.teacherName || t.fullName)) || "",
      status:"منشور",
      createdAt:now()
    };
  }

  function addLesson(data){
    const item = {...teacherBase(data.subject), title:clean(data.title), link:clean(data.link), type:"درس"};
    const a = list("lessons"); a.unshift(item); save("lessons", a);
    notifySubjectStudents(item.subject, "درس جديد", "تم نشر درس جديد في مادة " + item.subject, "درس");
    return item;
  }

  function addExam(data){
    const item = {...teacherBase(data.subject), title:clean(data.title), total:Number(data.total||0), questions:data.questions||[], type:"اختبار"};
    const a = list("exams"); a.unshift(item); save("exams", a);
    notifySubjectStudents(item.subject, "اختبار جديد", "تم نشر اختبار جديد في مادة " + item.subject, "اختبار");
    return item;
  }

  function addAssignment(data){
    const item = {...teacherBase(data.subject), title:clean(data.title), total:Number(data.total||0), questions:data.questions||[], type:"واجب"};
    const a = list("assignments"); a.unshift(item); save("assignments", a);
    notifySubjectStudents(item.subject, "واجب جديد", "تم نشر واجب جديد في مادة " + item.subject, "واجب");
    return item;
  }

  function addAttendanceSession(data){
    const minutes = Number(data.minutes || 10);
    const item = {...teacherBase(data.subject), title:clean(data.title), minutes, startedAt:Date.now(), endsAt:Date.now()+minutes*60000, type:"حضور"};
    const a = list("attendanceSessions"); a.unshift(item); save("attendanceSessions", a);
    notifySubjectStudents(item.subject, "تسجيل حضور", "تم فتح تسجيل الحضور في مادة " + item.subject, "حضور");
    return item;
  }

  function addFinalResult(studentIdValue,subject,score,total){
    const st = list("students").find(s => studentId(s) === clean(studentIdValue));
    const item = {
      id:id("result"),
      studentId:clean(studentIdValue),
      studentName:st && (st.name || st.studentName) || "",
      parentId:st ? parentId(st) : "",
      subject:normalizeSubject(subject),
      score:Number(score || 0),
      total:Number(total || 100),
      type:"نهائي",
      title:"النتيجة النهائية",
      createdAt:now()
    };
    const a = list("results"); a.unshift(item); save("results", a);
    addNotification("student", item.studentId, "نتيجة نهائية", "تم إضافة نتيجتك النهائية في مادة " + item.subject, "نتيجة", item.subject);
    addNotification("parent", item.parentId, "نتيجة نهائية", "تم إضافة نتيجة الطالب " + item.studentName + " في مادة " + item.subject, "نتيجة", item.subject);
    addNotification("admin", "admin", "نتيجة نهائية", "تم إضافة نتيجة نهائية للطالب " + item.studentName, "نتيجة", item.subject);
    refreshLeaderboard(item.subject);
    return item;
  }

  function itemsForStudent(storeName,subject){
    const st = freshStudent();
    if(!st) return [];
    return list(storeName).filter(x =>
      (!subject || normalizeSubject(x.subject) === normalizeSubject(subject)) &&
      normalizeGrade(x.grade) === normalizeGrade(st.grade) &&
      (st.subjects || []).map(normalizeSubject).includes(normalizeSubject(x.subject)) &&
      (!x.status || x.status === "منشور")
    );
  }

  function submitWork(kind,itemId,answers){
    const st = freshStudent();
    if(!st) throw Error("سجل الدخول أولاً");
    const sourceStore = kind === "exam" ? "exams" : "assignments";
    const targetStore = kind === "exam" ? "examSubmissions" : "assignmentSubmissions";
    const item = list(sourceStore).find(x => x.id === itemId);
    if(!item) throw Error("العنصر غير موجود");

    const submitted = list(targetStore).find(x => x.studentId === studentId(st) && x.itemId === itemId);
    if(submitted) throw Error("تم الحل مسبقاً");

    let score = 0, total = 0, correct = 0;
    (item.questions || []).forEach((q,i) => {
      total += Number(q.degree || 0);
      if(["choice","truefalse","blank"].includes(q.type) && clean(answers[i]) === clean(q.answer)){
        score += Number(q.degree || 0);
        correct++;
      }
    });

    const sub = {
      id:id("submit"),
      itemId,
      title:item.title,
      studentId:studentId(st),
      studentName:st.name || st.studentName,
      parentId:parentId(st),
      subject:normalizeSubject(item.subject),
      answers,
      score,
      total,
      correct,
      needsManual:(item.questions || []).some(q => ["essay","image"].includes(q.type)),
      status:"تم التسليم",
      createdAt:now()
    };

    const a = list(targetStore); a.unshift(sub); save(targetStore, a);
    addNotification("teacher", item.teacherCode, "تسليم جديد", sub.studentName + " قام بتسليم " + item.title, kind === "exam" ? "اختبار" : "واجب", item.subject);
    addNotification("admin", "admin", "تسليم جديد", sub.studentName + " قام بتسليم " + item.title, kind === "exam" ? "اختبار" : "واجب", item.subject);
    refreshLeaderboard(item.subject);
    return sub;
  }

  function registerAttendance(sessionId){
    const st = freshStudent();
    const session = list("attendanceSessions").find(x => x.id === sessionId);
    if(!st || !session) throw Error("جلسة الحضور غير موجودة");

    const existing = list("attendance").find(x => x.studentId === studentId(st) && x.sessionId === sessionId);
    if(existing) throw Error("تم تسجيل الحضور مسبقاً");

    const status = Date.now() <= Number(session.endsAt) ? "حاضر" : "غائب";
    const record = {
      id:id("attendance"),
      sessionId,
      studentId:studentId(st),
      studentName:st.name || st.studentName,
      parentId:parentId(st),
      subject:normalizeSubject(session.subject),
      title:session.title,
      status,
      createdAt:now()
    };
    const a = list("attendance"); a.unshift(record); save("attendance", a);
    addNotification("teacher", session.teacherCode, "تسجيل حضور", record.studentName + " تم تسجيله: " + status, "حضور", session.subject);
    addNotification("admin", "admin", "تسجيل حضور", record.studentName + " تم تسجيله: " + status, "حضور", session.subject);
    return record;
  }

  function recordsForStudent(storeName,studentIdValue,subject){
    return list(storeName).filter(x =>
      (x.studentId === studentIdValue || x.code === studentIdValue) &&
      (!subject || normalizeSubject(x.subject) === normalizeSubject(subject))
    );
  }

  function refreshLeaderboard(subject){
    const subjects = subject ? [normalizeSubject(subject)] : list("subjects").map(s => normalizeSubject(s.name || s.subject));
    let board = list("leaderboard").filter(x => subject && normalizeSubject(x.subject) !== normalizeSubject(subject));

    subjects.forEach(sub => {
      const students = subjectStudents(sub);
      students.forEach(st => {
        const sidv = studentId(st);
        const examScore = recordsForStudent("examSubmissions", sidv, sub).reduce((s,x)=>s+Number(x.score||0),0);
        const assScore = recordsForStudent("assignmentSubmissions", sidv, sub).reduce((s,x)=>s+Number(x.score||0),0);
        const attendance = recordsForStudent("attendance", sidv, sub).filter(x => x.status === "حاضر").length;
        const final = recordsForStudent("results", sidv, sub).find(x => x.type === "نهائي");
        const points = examScore + assScore + attendance + Number(final ? final.score : 0);
        board.push({id:sidv+"-"+sub, studentId:sidv, studentName:st.name || st.studentName, subject:sub, points});
      });
    });

    board.sort((a,b)=>Number(b.points||0)-Number(a.points||0));
    save("leaderboard", board);
  }

  function counts(){
    const obj = {};
    Object.keys(STORE).forEach(k => obj[k] = list(k).length);
    return obj;
  }

  function clearAll(){
    Object.keys(STORE).forEach(k => save(k, []));
    ["afaq_current_student","afaq_current_teacher","afaq_current_parent","afaq_current_subject"].forEach(k => localStorage.removeItem(k));
    broadcast();
  }

  window.AfaqCentral = {
    STORE, read, write, list, save, clean, now, id,
    normalizeGrade, normalizeSubject,
    studentId, teacherCode, parentId,
    currentStudent:freshStudent, currentTeacher:freshTeacher, currentParent,
    setCurrentStudent, setCurrentTeacher,
    normalizeAll,
    visibleSubjectsForStudent, studentJoinedSubject, subjectStudents, teacherStudents,
    addNotification, notificationsFor, clearNotifications,
    submitSubjectRequest, approveSubjectRequest, rejectSubjectRequest,
    addLesson, addExam, addAssignment, addAttendanceSession, addFinalResult,
    itemsForStudent, submitWork, registerAttendance, recordsForStudent,
    refreshLeaderboard, counts, clearAll
  };

  document.addEventListener("DOMContentLoaded", normalizeAll);
})();
