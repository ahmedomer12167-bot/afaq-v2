/* =========================================================
   AFAQ UNIFIED MESSAGING SYSTEM
   نظام رسائل موحد:
   - المدير يرسل لأي دور/شخص
   - المدرس يرسل لكل طلاب المادة أو طالب محدد أو ولي أمر مربوط بطالب
   - الطالب يرسل للمدير أو مدرس المادة المسجل بها
   - ولي الأمر يرسل للمدير أو مدرس الطالب
   ========================================================= */
(function(){
  function read(key){
    try{return JSON.parse(localStorage.getItem(key)) || [];}catch(e){return [];}
  }

  function write(key,value){
    localStorage.setItem(key, JSON.stringify(value || []));
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }

  function now(){
    return new Date().toLocaleString("ar");
  }

  function id(prefix){
    return prefix + "-" + Date.now() + "-" + Math.floor(Math.random()*9999);
  }

  function clean(v){
    return String(v || "").trim();
  }

  function getStudents(){return read("afaq_students");}
  function getTeachers(){return read("afaq_teachers");}
  function getMessages(){return read("afaq_messages");}

  function currentStudent(){
    try{return JSON.parse(localStorage.getItem("afaq_current_student")) || null;}catch(e){return null;}
  }

  function currentTeacher(){
    try{return JSON.parse(localStorage.getItem("afaq_current_teacher")) || null;}catch(e){return null;}
  }

  function currentParent(){
    try{return JSON.parse(localStorage.getItem("afaq_current_parent")) || null;}catch(e){return null;}
  }

  function studentId(st){
    return clean(st && (st.studentId || st.code || st.id));
  }

  function teacherCode(t){
    return clean(t && (t.teacherCode || t.code || t.id));
  }

  function parentIdFromStudent(st){
    return clean(st && (st.parentCode || st.parentPhone || st.parentName || st.guardianCode || st.guardianPhone || st.guardianName));
  }

  function studentMatchesTeacher(st,t){
    const subjects = Array.isArray(st.subjects) ? st.subjects : [];
    return (!t.grade || st.grade === t.grade) && (!t.subject || subjects.includes(t.subject));
  }

  function teacherStudents(){
    const t = currentTeacher();
    if(!t) return [];
    return getStudents().filter(st => studentMatchesTeacher(st,t));
  }

  function teachersForStudent(st){
    const subjects = Array.isArray(st.subjects) ? st.subjects : [];
    return getTeachers().filter(t =>
      (!t.grade || t.grade === st.grade) &&
      (!t.subject || subjects.includes(t.subject))
    );
  }

  function searchStudents(query, scopeTeacher){
    const q = clean(query);
    let list = scopeTeacher ? teacherStudents() : getStudents();

    if(!q) return list;

    return list.filter(st =>
      clean(st.name).includes(q) ||
      clean(st.fullName).includes(q) ||
      clean(st.studentName).includes(q) ||
      clean(st.code).includes(q) ||
      clean(st.studentId).includes(q) ||
      clean(st.phone).includes(q) ||
      clean(st.parentName).includes(q) ||
      clean(st.guardianName).includes(q)
    );
  }

  function searchTeachers(query){
    const q = clean(query);
    const list = getTeachers();
    if(!q) return list;
    return list.filter(t =>
      clean(t.fullName || t.name || t.teacherName).includes(q) ||
      clean(t.teacherCode || t.code).includes(q) ||
      clean(t.subject).includes(q) ||
      clean(t.grade).includes(q)
    );
  }

  function addMessage(data){
    const messages = getMessages();
    const message = {
      id:id("msg"),
      fromRole:clean(data.fromRole),
      fromId:clean(data.fromId),
      fromName:clean(data.fromName),
      toRole:clean(data.toRole),
      toId:clean(data.toId),
      toName:clean(data.toName),
      subject:clean(data.subject) || "رسالة جديدة",
      body:clean(data.body),
      relatedStudentId:clean(data.relatedStudentId),
      relatedStudentName:clean(data.relatedStudentName),
      subjectName:clean(data.subjectName || data.subject),
      teacherCode:clean(data.teacherCode),
      read:false,
      seen:false,
      archived:false,
      createdAt:now()
    };

    messages.unshift(message);
    write("afaq_messages", messages);

    if(window.AfaqData && AfaqData.addNotification){
      AfaqData.addNotification(
        message.toRole,
        message.toId,
        "رسالة جديدة",
        "وصلتك رسالة من " + (message.fromName || message.fromRole),
        "رسائل",
        message.subjectName
      );
    }

    return message;
  }

  function sendBulkToStudents(students, data){
    return students.map(st => addMessage({
      ...data,
      toRole:"student",
      toId:studentId(st),
      toName:st.name || st.fullName || st.studentName,
      relatedStudentId:studentId(st),
      relatedStudentName:st.name || st.fullName || st.studentName
    }));
  }

  function inbox(role,id){
    const r = clean(role), i = clean(id);
    return getMessages().filter(m =>
      !m.archived &&
      m.toRole === r &&
      (!i || m.toId === i || m.toId === "all")
    );
  }

  function sent(role,id){
    const r = clean(role), i = clean(id);
    return getMessages().filter(m =>
      m.fromRole === r &&
      (!i || m.fromId === i)
    );
  }

  function markRead(messageId){
    const messages = getMessages();
    const m = messages.find(x => x.id === messageId);
    if(m){
      m.read = true;
      m.seen = true;
      write("afaq_messages", messages);
    }
  }

  function markAllRead(role,id){
    const r = clean(role), i = clean(id);
    const messages = getMessages().map(m => {
      if(m.toRole === r && (!i || m.toId === i || m.toId === "all")){
        return {...m, read:true, seen:true};
      }
      return m;
    });
    write("afaq_messages", messages);
  }

  function deleteMessage(messageId){
    write("afaq_messages", getMessages().filter(m => m.id !== messageId));
  }

  function roleLabel(role){
    return {
      admin:"المدير",
      teacher:"المدرس",
      student:"الطالب",
      parent:"ولي الأمر"
    }[role] || role;
  }

  window.AfaqMessages = {
    read, write, clean,
    currentStudent, currentTeacher, currentParent,
    studentId, teacherCode, parentIdFromStudent,
    getStudents, getTeachers, getMessages,
    teacherStudents, teachersForStudent,
    searchStudents, searchTeachers,
    addMessage, sendBulkToStudents,
    inbox, sent, markRead, markAllRead, deleteMessage,
    roleLabel
  };
})();
