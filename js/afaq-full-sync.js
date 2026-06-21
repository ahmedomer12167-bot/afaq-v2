/* =========================================================
   AFAQ FULL SYNC FIX
   توحيد الصفوف والمواد بين المدير والمدرس والطالب
   يحل مشكلة عدم ظهور المواد للطالب بعد إضافتها من المدير
   ========================================================= */
(function(){
  function read(key){
    try{return JSON.parse(localStorage.getItem(key)) || [];}catch(e){return [];}
  }
  function write(key,value){
    localStorage.setItem(key, JSON.stringify(value || []));
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }
  function clean(v){return String(v || "").trim();}
  function now(){return new Date().toLocaleString("ar");}
  function id(prefix){return prefix + "-" + Date.now() + "-" + Math.floor(Math.random()*9999);}

  function normalizeGrade(value){
    const v = clean(value)
      .replaceAll("أ","ا")
      .replaceAll("إ","ا")
      .replaceAll("ى","ي")
      .replaceAll("ة","ه");

    const map = {
      "اول متوسط":"أول متوسط",
      "الاول متوسط":"أول متوسط",
      "ثاني متوسط":"ثاني متوسط",
      "الثاني متوسط":"ثاني متوسط",
      "ثالث متوسط":"ثالث متوسط",
      "الثالث متوسط":"ثالث متوسط",
      "رابع اعدادي":"رابع إعدادي",
      "الرابع اعدادي":"رابع إعدادي",
      "رابع علمي":"رابع إعدادي",
      "الرابع العلمي":"رابع إعدادي",
      "خامس اعدادي":"خامس إعدادي",
      "الخامس اعدادي":"خامس إعدادي",
      "خامس علمي":"خامس إعدادي",
      "الخامس العلمي":"خامس إعدادي",
      "سادس اعدادي":"سادس إعدادي",
      "السادس اعدادي":"سادس إعدادي",
      "سادس علمي":"سادس إعدادي",
      "السادس العلمي":"سادس إعدادي"
    };
    return map[v] || clean(value);
  }

  function normalizeSubject(value){
    const v = clean(value);
    const map = {
      "احياء":"الأحياء",
      "الاحياء":"الأحياء",
      "أحياء":"الأحياء",
      "الأحياء":"الأحياء",
      "كيمياء":"الكيمياء",
      "الكيمياء":"الكيمياء",
      "فيزياء":"الفيزياء",
      "الفيزياء":"الفيزياء",
      "رياضيات":"الرياضيات",
      "الرياضيات":"الرياضيات",
      "انكليزي":"الإنكليزي",
      "الانكليزي":"الإنكليزي",
      "إنكليزي":"الإنكليزي",
      "الإنكليزي":"الإنكليزي",
      "عربي":"العربي",
      "العربي":"العربي",
      "اسلامية":"الإسلامية",
      "الاسلامية":"الإسلامية",
      "الإسلامية":"الإسلامية"
    };
    return map[v] || v;
  }

  function students(){return read("afaq_students");}
  function teachers(){return read("afaq_teachers");}
  function subjects(){return read("afaq_subjects");}
  function requests(){return read("afaq_subject_requests");}

  function saveStudents(list){write("afaq_students", list);}
  function saveSubjects(list){write("afaq_subjects", list);}
  function saveRequests(list){write("afaq_subject_requests", list);}

  function currentStudent(){
    try{return JSON.parse(localStorage.getItem("afaq_current_student")) || null;}catch(e){return null;}
  }
  function currentTeacher(){
    try{return JSON.parse(localStorage.getItem("afaq_current_teacher")) || null;}catch(e){return null;}
  }
  function setCurrentStudent(st){
    localStorage.setItem("afaq_current_student", JSON.stringify(st));
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }

  function studentId(st){
    return clean(st && (st.studentId || st.code || st.studentCode || st.id));
  }
  function teacherCode(t){
    return clean(t && (t.teacherCode || t.code || t.id));
  }

  function getSubjectName(s){
    return normalizeSubject(s.name || s.subject || s.subjectName);
  }

  function getSubjectGrade(s){
    return normalizeGrade(s.grade || s.stage || s.className);
  }

  function ensureSubjectsNormalized(){
    const list = subjects();
    let changed = false;
    const fixed = list.map(s => {
      const obj = {...s};
      const name = getSubjectName(obj);
      const grade = getSubjectGrade(obj);

      if(obj.name !== name){obj.name = name; changed = true;}
      if(obj.subject !== name){obj.subject = name; changed = true;}
      if(obj.grade !== grade){obj.grade = grade; changed = true;}
      if(!obj.id){obj.id = "subject-" + Date.now() + "-" + Math.floor(Math.random()*9999); changed = true;}

      return obj;
    });

    if(changed) saveSubjects(fixed);
    return fixed;
  }

  function ensureStudentsNormalized(){
    const list = students();
    let changed = false;
    const fixed = list.map(st => {
      const obj = {...st};
      const grade = normalizeGrade(obj.grade || obj.stage || obj.className);
      if(obj.grade !== grade){obj.grade = grade; changed = true;}

      if(!obj.code && obj.studentCode){obj.code = obj.studentCode; changed = true;}
      if(!obj.studentId && obj.code){obj.studentId = obj.code; changed = true;}

      if(!Array.isArray(obj.subjects)){obj.subjects = []; changed = true;}
      obj.subjects = obj.subjects.map(normalizeSubject);
      return obj;
    });

    if(changed) saveStudents(fixed);
    return fixed;
  }

  function visibleSubjectsForStudent(st){
    ensureSubjectsNormalized();
    st = st || currentStudent();
    if(!st) return [];

    const studentGrade = normalizeGrade(st.grade);
    const list = subjects();

    // إذا لم يوجد صف للطالب، اعرض كل المواد حتى لا تبقى فارغة
    if(!studentGrade) return list;

    // اعرض المواد المطابقة للصف + المواد التي لا يوجد لها صف
    return list.filter(s => {
      const g = getSubjectGrade(s);
      return !g || g === studentGrade;
    });
  }

  function isStudentJoined(subject, st){
    st = st || currentStudent();
    if(!st) return false;

    const subName = getSubjectName(subject);
    const subjectCode = clean(subject.subjectCode);
    const subjectsList = Array.isArray(st.subjects) ? st.subjects.map(normalizeSubject) : [];
    const codesList = Array.isArray(st.subjectCodes) ? st.subjectCodes.map(clean) : [];

    return subjectsList.includes(subName) || (subjectCode && codesList.includes(subjectCode));
  }

  function existingRequest(subject, st){
    st = st || currentStudent();
    if(!st) return null;

    const sid = studentId(st);
    const subName = getSubjectName(subject);
    const subCode = clean(subject.subjectCode);

    return requests().find(r =>
      clean(r.studentId) === sid &&
      normalizeSubject(r.subject) === subName &&
      clean(r.subjectCode) === subCode &&
      clean(r.status) === "قيد المراجعة"
    );
  }

  function submitJoinRequest(subjectId, code){
    const st = currentStudent();
    if(!st) throw new Error("سجل الدخول كطالب أولاً");

    const list = ensureSubjectsNormalized();
    const sub = list.find(s => String(s.id) === String(subjectId));
    if(!sub) throw new Error("المادة غير موجودة");

    const entered = clean(code);
    if(!entered) throw new Error("أدخل كود المادة");

    if(clean(sub.subjectCode) !== entered) throw new Error("كود المادة غير صحيح");

    if(isStudentJoined(sub, st)) throw new Error("أنت مسجل في هذه المادة مسبقاً");
    if(existingRequest(sub, st)) throw new Error("لديك طلب قيد المراجعة لهذه المادة");

    const req = {
      id:id("subjectreq"),
      status:"قيد المراجعة",
      studentId:studentId(st),
      studentCode:studentId(st),
      studentName:clean(st.name || st.studentName || st.fullName),
      parentName:clean(st.parentName || st.guardianName),
      grade:normalizeGrade(st.grade),
      phone:clean(st.phone),
      amount:clean(st.amount),
      subject:getSubjectName(sub),
      subjectCode:clean(sub.subjectCode),
      teacherCode:clean(sub.teacherCode),
      teacherName:clean(sub.teacherName),
      subjectId:sub.id,
      createdAt:now()
    };

    const reqs = requests();
    reqs.unshift(req);
    saveRequests(reqs);

    if(window.AfaqData && AfaqData.addNotification){
      AfaqData.addNotification("teacher", req.teacherCode, "طلب دخول مادة", "الطالب " + req.studentName + " طلب الدخول إلى مادة " + req.subject, "طلبات المواد", req.subject);
      AfaqData.addNotification("admin", "admin", "طلب دخول مادة", "طلب جديد لدخول مادة " + req.subject + " من الطالب " + req.studentName, "طلبات المواد", req.subject);
    }

    return req;
  }

  function teacherRequests(){
    const t = currentTeacher();
    if(!t) return [];
    const code = teacherCode(t);
    return requests().filter(r => clean(r.teacherCode) === code);
  }

  function approveRequest(requestId){
    const reqs = requests();
    const req = reqs.find(r => r.id === requestId);
    if(!req) throw new Error("الطلب غير موجود");

    req.status = "مقبول";
    req.approvedAt = now();
    saveRequests(reqs);

    const all = ensureStudentsNormalized();
    const st = all.find(s => studentId(s) === clean(req.studentId) || clean(s.code) === clean(req.studentId));
    if(!st) throw new Error("الطالب غير موجود في قاعدة الطلاب");

    if(!Array.isArray(st.subjects)) st.subjects = [];
    const subName = normalizeSubject(req.subject);
    if(!st.subjects.map(normalizeSubject).includes(subName)) st.subjects.push(subName);

    if(!Array.isArray(st.subjectCodes)) st.subjectCodes = [];
    if(req.subjectCode && !st.subjectCodes.map(clean).includes(clean(req.subjectCode))) st.subjectCodes.push(clean(req.subjectCode));

    if(!Array.isArray(st.teacherCodes)) st.teacherCodes = [];
    if(req.teacherCode && !st.teacherCodes.map(clean).includes(clean(req.teacherCode))) st.teacherCodes.push(clean(req.teacherCode));

    saveStudents(all);

    const current = currentStudent();
    if(current && studentId(current) === studentId(st)) setCurrentStudent(st);

    if(window.AfaqData && AfaqData.addNotification){
      AfaqData.addNotification("student", req.studentId, "تم قبول دخول المادة", "تم قبولك في مادة " + req.subject, "طلبات المواد", req.subject);
      AfaqData.addNotification("admin", "admin", "قبول دخول مادة", "تم قبول " + req.studentName + " في مادة " + req.subject, "طلبات المواد", req.subject);
    }

    return st;
  }

  function rejectRequest(requestId, note){
    const reqs = requests();
    const req = reqs.find(r => r.id === requestId);
    if(!req) throw new Error("الطلب غير موجود");

    req.status = "مرفوض";
    req.note = clean(note);
    req.rejectedAt = now();
    saveRequests(reqs);

    if(window.AfaqData && AfaqData.addNotification){
      AfaqData.addNotification("student", req.studentId, "تم رفض دخول المادة", "تم رفض طلبك في مادة " + req.subject + (req.note ? " - " + req.note : ""), "طلبات المواد", req.subject);
    }

    return req;
  }

  function studentRequests(){
    const st = currentStudent();
    if(!st) return [];
    const sid = studentId(st);
    return requests().filter(r => clean(r.studentId) === sid);
  }

  function resyncCurrentStudent(){
    const st = currentStudent();
    if(!st) return null;
    const all = ensureStudentsNormalized();
    const fresh = all.find(s => studentId(s) === studentId(st) || clean(s.code) === studentId(st));
    if(fresh) setCurrentStudent(fresh);
    return fresh || st;
  }

  window.AfaqFullSync = {
    read, write, clean, normalizeGrade, normalizeSubject,
    subjects, students, requests,
    ensureSubjectsNormalized, ensureStudentsNormalized,
    currentStudent, currentTeacher, setCurrentStudent, resyncCurrentStudent,
    studentId, teacherCode,
    visibleSubjectsForStudent, isStudentJoined, existingRequest,
    submitJoinRequest, teacherRequests, approveRequest, rejectRequest, studentRequests
  };

  // تشغيل تصحيح تلقائي عند تحميل أي صفحة
  document.addEventListener("DOMContentLoaded", function(){
    ensureSubjectsNormalized();
    ensureStudentsNormalized();
    resyncCurrentStudent();
  });
})();
