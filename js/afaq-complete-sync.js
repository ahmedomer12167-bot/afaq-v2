/* AFAQ COMPLETE SYNC SYSTEM */
(function(){
  const K={
    students:"afaq_students", subjects:"afaq_subjects", requests:"afaq_subject_requests",
    lessons:"afaq_lessons", exams:"afaq_exams", assignments:"afaq_assignments",
    attendance:"afaq_attendance", results:"afaq_results", notifications:"afaq_notifications",
    messages:"afaq_messages", leaderboard:"afaq_leaderboard",
    examSubs:"afaq_exam_submissions", assignmentSubs:"afaq_assignment_submissions"
  };
  function read(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}}
  function write(k,v){localStorage.setItem(k,JSON.stringify(v||[]));window.dispatchEvent(new Event("afaqDataUpdated"))}
  function clean(v){return String(v||"").trim()}
  function now(){return new Date().toLocaleString("ar")}
  function id(p){return p+"-"+Date.now()+"-"+Math.floor(Math.random()*9999)}
  function nGrade(v){
    let x=clean(v).replaceAll("أ","ا").replaceAll("إ","ا").replaceAll("ى","ي").replaceAll("ة","ه");
    const m={"اول متوسط":"أول متوسط","الاول متوسط":"أول متوسط","ثاني متوسط":"ثاني متوسط","الثاني متوسط":"ثاني متوسط","ثالث متوسط":"ثالث متوسط","الثالث متوسط":"ثالث متوسط","رابع اعدادي":"رابع إعدادي","رابع علمي":"رابع إعدادي","الرابع العلمي":"رابع إعدادي","خامس اعدادي":"خامس إعدادي","خامس علمي":"خامس إعدادي","الخامس العلمي":"خامس إعدادي","سادس اعدادي":"سادس إعدادي","سادس علمي":"سادس إعدادي","السادس العلمي":"سادس إعدادي"};
    return m[x]||clean(v);
  }
  function nSub(v){
    let x=clean(v).replaceAll("أ","ا").replaceAll("إ","ا");
    const m={"احياء":"الأحياء","الاحياء":"الأحياء","كيمياء":"الكيمياء","فيزياء":"الفيزياء","رياضيات":"الرياضيات","انكليزي":"الإنكليزي","الانكليزي":"الإنكليزي","عربي":"العربي","اسلامية":"الإسلامية","الاسلامية":"الإسلامية"};
    return m[x]||clean(v);
  }
  function subjects(){return read(K.subjects).map(s=>({...s,id:s.id||id("subject"),name:nSub(s.name||s.subject||s.subjectName),subject:nSub(s.name||s.subject||s.subjectName),grade:nGrade(s.grade||s.stage||s.className)}))}
  function students(){return read(K.students).map(s=>({...s,grade:nGrade(s.grade||s.stage||s.className),code:s.code||s.studentCode||s.studentId,studentId:s.studentId||s.code||s.studentCode,subjects:Array.isArray(s.subjects)?s.subjects.map(nSub):[],subjectCodes:Array.isArray(s.subjectCodes)?s.subjectCodes.map(clean):[]}))}
  function saveSubjects(a){write(K.subjects,a)}
  function saveStudents(a){write(K.students,a)}
  function normalizeAll(){saveSubjects(subjects()); saveStudents(students());}
  function curStudent(){try{return JSON.parse(localStorage.getItem("afaq_current_student"))||null}catch(e){return null}}
  function setCurStudent(s){localStorage.setItem("afaq_current_student",JSON.stringify(s));window.dispatchEvent(new Event("afaqDataUpdated"))}
  function curTeacher(){try{return JSON.parse(localStorage.getItem("afaq_current_teacher"))||null}catch(e){return null}}
  function sid(s){return clean(s&&(s.studentId||s.code||s.studentCode||s.id))}
  function tcode(t){return clean(t&&(t.teacherCode||t.code||t.id))}
  function freshStudent(){normalizeAll(); const c=curStudent(); if(!c)return null; const f=students().find(s=>sid(s)===sid(c)); if(f)setCurStudent(f); return f||c}
  function visibleSubjects(st){st=st||freshStudent(); const g=nGrade(st&&st.grade); return subjects().filter(s=>!g||!s.grade||s.grade===g)}
  function isJoined(sub,st){st=st||freshStudent(); const nm=nSub(sub.name||sub.subject); const code=clean(sub.subjectCode); return (st.subjects||[]).map(nSub).includes(nm)||((st.subjectCodes||[]).map(clean).includes(code)&&code)}
  function reqs(){return read(K.requests)}
  function saveReqs(a){write(K.requests,a)}
  function pending(sub,st){st=st||freshStudent(); return reqs().find(r=>sid(r)===sid(st)&&nSub(r.subject)===nSub(sub.name||sub.subject)&&clean(r.subjectCode)===clean(sub.subjectCode)&&r.status==="قيد المراجعة")}
  function submitJoin(subjectId, code){
    const st=freshStudent(); if(!st)throw Error("سجل الدخول أولاً");
    const sub=subjects().find(s=>String(s.id)===String(subjectId)); if(!sub)throw Error("المادة غير موجودة");
    if(clean(code)!==clean(sub.subjectCode))throw Error("كود المادة غير صحيح");
    if(isJoined(sub,st))throw Error("أنت مسجل في هذه المادة مسبقاً");
    if(pending(sub,st))throw Error("لديك طلب قيد المراجعة");
    const r={id:id("subjectreq"),status:"قيد المراجعة",studentId:sid(st),studentCode:sid(st),studentName:st.name||st.studentName||st.fullName,parentName:st.parentName||st.guardianName,grade:nGrade(st.grade),phone:st.phone||"",amount:st.amount||"",subject:nSub(sub.name||sub.subject),subjectCode:clean(sub.subjectCode),teacherCode:clean(sub.teacherCode),teacherName:sub.teacherName||"",subjectId:sub.id,createdAt:now()};
    const all=reqs(); all.unshift(r); saveReqs(all); addNotif("teacher",r.teacherCode,"طلب دخول مادة","طلب الطالب "+r.studentName+" دخول مادة "+r.subject,"طلبات المواد",r.subject); addNotif("admin","admin","طلب دخول مادة","طلب جديد من "+r.studentName+" لمادة "+r.subject,"طلبات المواد",r.subject); return r;
  }
  function teacherRequests(){const t=curTeacher(); return reqs().filter(r=>clean(r.teacherCode)===tcode(t))}
  function approve(idr){const all=reqs(); const r=all.find(x=>x.id===idr); if(!r)throw Error("الطلب غير موجود"); r.status="مقبول"; r.approvedAt=now(); saveReqs(all); const ss=students(); const st=ss.find(s=>sid(s)===clean(r.studentId)); if(!st)throw Error("الطالب غير موجود"); st.subjects=Array.isArray(st.subjects)?st.subjects:[]; if(!st.subjects.map(nSub).includes(nSub(r.subject)))st.subjects.push(nSub(r.subject)); st.subjectCodes=Array.isArray(st.subjectCodes)?st.subjectCodes:[]; if(r.subjectCode&&!st.subjectCodes.map(clean).includes(clean(r.subjectCode)))st.subjectCodes.push(clean(r.subjectCode)); st.teacherCodes=Array.isArray(st.teacherCodes)?st.teacherCodes:[]; if(r.teacherCode&&!st.teacherCodes.map(clean).includes(clean(r.teacherCode)))st.teacherCodes.push(clean(r.teacherCode)); saveStudents(ss); if(sid(curStudent())===sid(st))setCurStudent(st); addNotif("student",sid(st),"تم قبول دخول المادة","تم قبولك في مادة "+r.subject,"طلبات المواد",r.subject); return st}
  function reject(idr,note){const all=reqs(); const r=all.find(x=>x.id===idr); if(!r)throw Error("الطلب غير موجود"); r.status="مرفوض"; r.note=clean(note); r.rejectedAt=now(); saveReqs(all); addNotif("student",r.studentId,"تم رفض دخول المادة","تم رفض طلبك في مادة "+r.subject,"طلبات المواد",r.subject)}
  function addNotif(toRole,toId,title,body,type,subject){const a=read(K.notifications); a.unshift({id:id("not"),toRole,toId,title,body,type,subject,read:false,createdAt:now()}); write(K.notifications,a)}
  function myNotifications(subject){const st=freshStudent(), idd=sid(st); return read(K.notifications).filter(n=>n.toRole==="student"&&(!n.toId||n.toId===idd||n.toId===st.name||n.toId==="all")&&(!subject||nSub(n.subject||n.sourceSubject)===nSub(subject)))}
  function clearNotifications(subject){let st=freshStudent(), idd=sid(st); let all=read(K.notifications).filter(n=>!(n.toRole==="student"&&(!n.toId||n.toId===idd||n.toId===st.name||n.toId==="all")&&(!subject||nSub(n.subject||n.sourceSubject)===nSub(subject)))); write(K.notifications,all)}
  function records(key, subject){const st=freshStudent(), idd=sid(st); return read(K[key]).filter(x=>(x.studentId===idd||x.code===idd)&&(!subject||nSub(x.subject||x.subjectName)===nSub(subject)))}
  document.addEventListener("DOMContentLoaded",normalizeAll);
  window.AfaqSync={read,write,clean,normalizeGrade:nGrade,normalizeSubject:nSub,subjects,students,normalizeAll,currentStudent:freshStudent,currentTeacher:curTeacher,studentId:sid,teacherCode:tcode,visibleSubjects,isJoined,pending,submitJoin,requests:reqs,teacherRequests,approve,reject,myNotifications,clearNotifications,records,addNotif};
})();
