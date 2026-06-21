/* =========================================================
   AFAQ SUBJECT JOIN REQUESTS SYSTEM
   عرض كل المواد للطالب + طلب كود المادة + موافقة المدرس
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

  function subjects(){return read("afaq_subjects");}
  function students(){return read("afaq_students");}
  function requests(){return read("afaq_subject_requests");}
  function saveRequests(list){write("afaq_subject_requests", list);}
  function saveStudents(list){write("afaq_students", list);}

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
    return clean(st && (st.studentId || st.code || st.id));
  }
  function teacherCode(t){
    return clean(t && (t.teacherCode || t.code || t.id));
  }

  function visibleSubjectsForStudent(st){
    const grade = clean(st && st.grade);
    const list = subjects();
    if(!grade) return list;
    return list.filter(s => !s.grade || clean(s.grade) === grade);
  }

  function isStudentJoined(subject, st){
    const list = Array.isArray(st.subjects) ? st.subjects : [];
    const name = clean(subject.name || subject.subject);
    return list.includes(name);
  }

  function existingRequest(subject, st){
    const sid = studentId(st);
    const name = clean(subject.name || subject.subject);
    const subjectCode = clean(subject.subjectCode);
    return requests().find(r =>
      clean(r.studentId) === sid &&
      clean(r.subject) === name &&
      clean(r.subjectCode) === subjectCode &&
      clean(r.status) === "قيد المراجعة"
    );
  }

  function submitJoinRequest(subjectId, code){
    const st = currentStudent();
    if(!st) throw new Error("سجل الدخول كطالب أولاً");

    const sub = subjects().find(s => String(s.id) === String(subjectId));
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
      grade:clean(st.grade),
      phone:clean(st.phone),
      amount:clean(st.amount),
      subject:clean(sub.name || sub.subject),
      subjectCode:clean(sub.subjectCode),
      teacherCode:clean(sub.teacherCode),
      teacherName:clean(sub.teacherName),
      subjectId:sub.id,
      createdAt:now()
    };

    const list = requests();
    list.unshift(req);
    saveRequests(list);

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
    const list = requests();
    const req = list.find(r => r.id === requestId);
    if(!req) throw new Error("الطلب غير موجود");

    req.status = "مقبول";
    req.approvedAt = now();
    saveRequests(list);

    const allStudents = students();
    const st = allStudents.find(s => studentId(s) === clean(req.studentId) || clean(s.code) === clean(req.studentId));
    if(!st) throw new Error("الطالب غير موجود في قاعدة الطلاب");

    if(!Array.isArray(st.subjects)) st.subjects = [];
    if(!st.subjects.includes(req.subject)) st.subjects.push(req.subject);

    if(!Array.isArray(st.subjectCodes)) st.subjectCodes = [];
    if(req.subjectCode && !st.subjectCodes.includes(req.subjectCode)) st.subjectCodes.push(req.subjectCode);

    if(!Array.isArray(st.teacherCodes)) st.teacherCodes = [];
    if(req.teacherCode && !st.teacherCodes.includes(req.teacherCode)) st.teacherCodes.push(req.teacherCode);

    saveStudents(allStudents);

    const current = currentStudent();
    if(current && studentId(current) === studentId(st)) setCurrentStudent(st);

    if(window.AfaqData && AfaqData.addNotification){
      AfaqData.addNotification("student", req.studentId, "تم قبول دخول المادة", "تم قبولك في مادة " + req.subject, "طلبات المواد", req.subject);
      AfaqData.addNotification("admin", "admin", "قبول دخول مادة", "تم قبول " + req.studentName + " في مادة " + req.subject, "طلبات المواد", req.subject);
    }

    return st;
  }

  function rejectRequest(requestId, note){
    const list = requests();
    const req = list.find(r => r.id === requestId);
    if(!req) throw new Error("الطلب غير موجود");

    req.status = "مرفوض";
    req.note = clean(note);
    req.rejectedAt = now();
    saveRequests(list);

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

  window.AfaqSubjectJoin = {
    read, write, clean,
    subjects, students, requests,
    currentStudent, currentTeacher,
    studentId, teacherCode,
    visibleSubjectsForStudent,
    isStudentJoined, existingRequest,
    submitJoinRequest,
    teacherRequests,
    approveRequest, rejectRequest,
    studentRequests
  };
})();
