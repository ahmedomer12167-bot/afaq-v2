/* =========================================================
 AFAQ FINAL REAL SYNC FIX
 يحل عدم ظهور اختبارات/واجبات/حضور المدرس عند الطالب
 ========================================================= */
(function(){
 const STORE={
  students:"afaq_students", teachers:"afaq_teachers", subjects:"afaq_subjects",
  exams:"afaq_exams", assignments:"afaq_assignments", lessons:"afaq_lessons",
  attendanceSessions:"afaq_attendance_sessions", attendance:"afaq_attendance",
  results:"afaq_results", notifications:"afaq_notifications",
  examSubmissions:"afaq_exam_submissions", assignmentSubmissions:"afaq_assignment_submissions",
  leaderboard:"afaq_leaderboard"
 };
 function read(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch(e){return[]}}
 function write(k,v){localStorage.setItem(k,JSON.stringify(v||[]));dispatch()}
 function dispatch(){window.dispatchEvent(new Event("afaqDataUpdated"));window.dispatchEvent(new Event("storage"))}
 function clean(v){return String(v||"").trim()}
 function now(){return new Date().toLocaleString("ar")}
 function id(p){return p+"-"+Date.now()+"-"+Math.floor(Math.random()*9999)}
 function nSub(v){let x=clean(v).replaceAll("أ","ا").replaceAll("إ","ا");const m={احياء:"الأحياء",الاحياء:"الأحياء",كيمياء:"الكيمياء",الكيمياء:"الكيمياء",فيزياء:"الفيزياء",الفيزياء:"الفيزياء",رياضيات:"الرياضيات",الرياضيات:"الرياضيات",انكليزي:"الإنكليزي",الانكليزي:"الإنكليزي",عربي:"العربي",العربي:"العربي",اسلامية:"الإسلامية",الاسلامية:"الإسلامية"};return m[x]||clean(v)}
 function nGrade(v){let x=clean(v).replaceAll("أ","ا").replaceAll("إ","ا").replaceAll("ة","ه");const m={"اول متوسط":"أول متوسط","الاول متوسط":"أول متوسط","ثاني متوسط":"ثاني متوسط","الثاني متوسط":"ثاني متوسط","ثالث متوسط":"ثالث متوسط","الثالث متوسط":"ثالث متوسط","رابع علمي":"رابع إعدادي","رابع اعدادي":"رابع إعدادي","خامس علمي":"خامس إعدادي","خامس اعدادي":"خامس إعدادي","سادس علمي":"سادس إعدادي","سادس اعدادي":"سادس إعدادي"};return m[x]||clean(v)}
 function curS(){try{return JSON.parse(localStorage.getItem("afaq_current_student"))||null}catch(e){return null}}
 function curT(){try{return JSON.parse(localStorage.getItem("afaq_current_teacher"))||null}catch(e){return null}}
 function setCurS(s){localStorage.setItem("afaq_current_student",JSON.stringify(s));dispatch()}
 function sid(s){return clean(s&&(s.studentId||s.code||s.studentCode||s.id))}
 function tid(t){return clean(t&&(t.teacherCode||t.code||t.id))}
 function list(name){return read(STORE[name])}
 function save(name,v){write(STORE[name],v)}
 function subjects(){return list("subjects").map(s=>({...s,id:s.id||id("subject"),name:nSub(s.name||s.subject||s.subjectName),subject:nSub(s.name||s.subject||s.subjectName),grade:nGrade(s.grade||s.stage||s.className)}))}
 function students(){return list("students").map(s=>({...s,code:s.code||s.studentCode||s.studentId,studentId:s.studentId||s.code||s.studentCode,name:s.name||s.studentName||s.fullName,studentName:s.studentName||s.name||s.fullName,grade:nGrade(s.grade||s.stage||s.className),subjects:Array.isArray(s.subjects)?s.subjects.map(nSub):[],subjectCodes:Array.isArray(s.subjectCodes)?s.subjectCodes.map(clean):[],teacherCodes:Array.isArray(s.teacherCodes)?s.teacherCodes.map(clean):[]}))}
 function normalizeAll(){save("subjects",subjects());save("students",students())}
 function freshStudent(){const c=curS(); if(!c)return null; const f=students().find(s=>sid(s)===sid(c)); if(f)setCurS(f); return f||c}
 function teacher(){const t=curT(); if(!t)return null; return {...t,teacherCode:t.teacherCode||t.code||t.id,subject:nSub(t.subject||t.subjectName),grade:nGrade(t.grade||t.stage||t.className),teacherName:t.teacherName||t.name||t.fullName}}
 function teacherStudents(){const t=teacher(); if(!t)return[]; return students().filter(s=>nGrade(s.grade)===nGrade(t.grade)&&(s.subjects||[]).map(nSub).includes(nSub(t.subject)))}
 function subjectStudents(subject){return students().filter(s=>(s.subjects||[]).map(nSub).includes(nSub(subject)))}
 function addNotif(toRole,toId,title,body,type,subject){const a=list("notifications");a.unshift({id:id("not"),toRole,toId:clean(toId),title,body,type,subject:nSub(subject),read:false,createdAt:now()});save("notifications",a)}
 function notifyStudents(subject,title,body,type){subjectStudents(subject).forEach(s=>addNotif("student",sid(s),title,body,type,subject));addNotif("admin","admin",title,body,type,subject)}
 function base(){const t=teacher(); if(!t)throw Error("سجل الدخول كمدرس"); return {id:id("item"),subject:nSub(t.subject),grade:nGrade(t.grade),teacherCode:tid(t),teacherName:t.teacherName||t.name||"",status:"منشور",createdAt:now()}}
 function addExam(title,finalDegree,questions){const b=base(); const item={...b,title:clean(title),finalDegree:Number(finalDegree||0),questions:questions||[],type:"اختبار"};const a=list("exams");a.unshift(item);save("exams",a);notifyStudents(item.subject,"اختبار جديد","تم نشر اختبار جديد في مادة "+item.subject,"اختبار",item.subject);return item}
 function addAssignment(title,finalDegree,questions){const b=base(); const item={...b,title:clean(title),finalDegree:Number(finalDegree||0),questions:questions||[],type:"واجب"};const a=list("assignments");a.unshift(item);save("assignments",a);notifyStudents(item.subject,"واجب جديد","تم نشر واجب جديد في مادة "+item.subject,"واجب",item.subject);return item}
 function addAttendance(title,minutes){const b=base(); const item={...b,title:clean(title),minutes:Number(minutes||10),startedAt:Date.now(),endsAt:Date.now()+Number(minutes||10)*60000,type:"حضور"};const a=list("attendanceSessions");a.unshift(item);save("attendanceSessions",a);notifyStudents(item.subject,"تسجيل حضور","تم فتح تسجيل الحضور في مادة "+item.subject,"حضور",item.subject);return item}
 function addLesson(title,link){const b=base(); const item={...b,title:clean(title),link:clean(link),type:"درس"};const a=list("lessons");a.unshift(item);save("lessons",a);notifyStudents(item.subject,"درس جديد","تم نشر درس جديد في مادة "+item.subject,"درس",item.subject);return item}
 function itemMatchesStudent(item,st,subject){
   const itemSub=nSub(item.subject), itemGrade=nGrade(item.grade);
   const stSubs=(st.subjects||[]).map(nSub), stCodes=(st.teacherCodes||[]).map(clean);
   const okSub=stSubs.includes(itemSub);
   const okGrade=!itemGrade||itemGrade===nGrade(st.grade);
   const okSubjectFilter=!subject||itemSub===nSub(subject);
   return okSub&&okGrade&&okSubjectFilter&&(!item.status||item.status==="منشور");
 }
 function studentItems(storeName,subject){const st=freshStudent(); if(!st)return[]; return list(storeName).filter(x=>itemMatchesStudent(x,st,subject))}
 function hasSubmitted(kind,itemId){const st=freshStudent(); const store=kind==="exam"?"examSubmissions":"assignmentSubmissions"; return list(store).some(x=>x.itemId===itemId&&x.studentId===sid(st))}
 function submitWork(kind,itemId,answers){const st=freshStudent(); if(!st)throw Error("سجل الدخول"); const source=kind==="exam"?"exams":"assignments"; const target=kind==="exam"?"examSubmissions":"assignmentSubmissions"; const item=list(source).find(x=>x.id===itemId); if(!item)throw Error("غير موجود"); if(hasSubmitted(kind,itemId))throw Error("تم الحل مسبقاً"); let autoScore=0,autoTotal=0,manualTotal=0,correct=0; (item.questions||[]).forEach((q,i)=>{const deg=Number(q.degree||0); if(["essay","image"].includes(q.type)){manualTotal+=deg}else{autoTotal+=deg; if(clean(answers[i])===clean(q.answer)){autoScore+=deg;correct++}}}); const sub={id:id("sub"),itemId,title:item.title,kind,studentId:sid(st),studentName:st.name||st.studentName,subject:nSub(item.subject),teacherCode:item.teacherCode,answers,autoScore,autoTotal,manualScore:null,manualTotal,totalScore:autoScore,finalDegree:Number(item.finalDegree||autoTotal+manualTotal),correct,needsManual:manualTotal>0,status:manualTotal>0?"بانتظار التصحيح اليدوي":"مصحح",createdAt:now()}; const a=list(target);a.unshift(sub);save(target,a); addNotif("teacher",item.teacherCode,"تسليم جديد",(st.name||st.studentName)+" قام بتسليم "+item.title,kind==="exam"?"اختبار":"واجب",item.subject); addNotif("admin","admin","تسليم جديد",(st.name||st.studentName)+" قام بتسليم "+item.title,kind==="exam"?"اختبار":"واجب",item.subject); updateResultFromSubmission(sub); return sub}
 function gradeManual(kind,subId,manualScore){const store=kind==="exam"?"examSubmissions":"assignmentSubmissions"; const a=list(store); const sub=a.find(x=>x.id===subId); if(!sub)throw Error("التسليم غير موجود"); sub.manualScore=Number(manualScore||0); sub.totalScore=Number(sub.autoScore||0)+Number(sub.manualScore||0); sub.status="مصحح"; sub.gradedAt=now(); save(store,a); updateResultFromSubmission(sub); addNotif("student",sub.studentId,"تم تصحيح "+(kind==="exam"?"الاختبار":"الواجب"),"درجتك: "+sub.totalScore+"/"+sub.finalDegree,kind==="exam"?"اختبار":"واجب",sub.subject); return sub}
 function updateResultFromSubmission(sub){const a=list("results"); const type=sub.kind==="exam"?"اختبار":"واجب"; const old=a.find(r=>r.submissionId===sub.id); const r={id:old?old.id:id("result"),submissionId:sub.id,studentId:sub.studentId,studentName:sub.studentName,subject:nSub(sub.subject),title:sub.title,type,score:Number(sub.totalScore||0),total:Number(sub.finalDegree||0),status:sub.status,createdAt:old?old.createdAt:now(),updatedAt:now()}; if(old){Object.assign(old,r)}else a.unshift(r); save("results",a); refreshLeaderboard(sub.subject)}
 function registerAttendance(sessionId){const st=freshStudent(); const item=list("attendanceSessions").find(x=>x.id===sessionId); if(!st||!item)throw Error("جلسة الحضور غير موجودة"); const a=list("attendance"); if(a.some(x=>x.sessionId===sessionId&&x.studentId===sid(st)))throw Error("تم التسجيل مسبقاً"); const status=Date.now()<=Number(item.endsAt)?"حاضر":"غائب"; const rec={id:id("att"),sessionId,studentId:sid(st),studentName:st.name||st.studentName,subject:nSub(item.subject),title:item.title,status,createdAt:now()}; a.unshift(rec); save("attendance",a); addNotif("teacher",item.teacherCode,"تسجيل حضور",rec.studentName+" تم تسجيله: "+status,"حضور",item.subject); addNotif("admin","admin","تسجيل حضور",rec.studentName+" تم تسجيله: "+status,"حضور",item.subject); return rec}
 function addFinalResult(studentId,subject,score,total){const st=students().find(s=>sid(s)===clean(studentId)); const a=list("results"); const r={id:id("result"),studentId:clean(studentId),studentName:st&&(st.name||st.studentName)||"",subject:nSub(subject),title:"النتيجة النهائية",type:"نهائي",score:Number(score||0),total:Number(total||100),status:"نهائي",createdAt:now()}; a.unshift(r);save("results",a);addNotif("student",r.studentId,"نتيجة نهائية","تم إضافة نتيجتك النهائية في "+r.subject,"نتيجة",r.subject);addNotif("admin","admin","نتيجة نهائية","تم إضافة نتيجة نهائية للطالب "+r.studentName,"نتيجة",r.subject);refreshLeaderboard(r.subject);return r}
 function records(storeName,subject){const st=freshStudent(); if(!st)return[]; return list(storeName).filter(x=>(x.studentId===sid(st)||x.code===sid(st))&&(!subject||nSub(x.subject)===nSub(subject)))}
 function teacherSubmissions(kind){const t=teacher(); const store=kind==="exam"?"examSubmissions":"assignmentSubmissions"; if(!t)return[]; return list(store).filter(x=>nSub(x.subject)===nSub(t.subject))}
 function refreshLeaderboard(subject){const sub=nSub(subject); let board=list("leaderboard").filter(x=>nSub(x.subject)!==sub); subjectStudents(sub).forEach(st=>{const idd=sid(st); const e=list("examSubmissions").filter(x=>x.studentId===idd&&nSub(x.subject)===sub).reduce((s,x)=>s+Number(x.totalScore||0),0); const a=list("assignmentSubmissions").filter(x=>x.studentId===idd&&nSub(x.subject)===sub).reduce((s,x)=>s+Number(x.totalScore||0),0); const att=list("attendance").filter(x=>x.studentId===idd&&nSub(x.subject)===sub&&x.status==="حاضر").length; const f=list("results").find(x=>x.studentId===idd&&nSub(x.subject)===sub&&x.type==="نهائي"); const points=e+a+att+Number(f?f.score:0); board.push({id:idd+"-"+sub,studentId:idd,studentName:st.name||st.studentName,subject:sub,points})}); board.sort((x,y)=>Number(y.points)-Number(x.points)); save("leaderboard",board)}
 window.AfaqRealSync={STORE,read,write,list,save,clean,now,id,normalizeSubject:nSub,normalizeGrade:nGrade,currentStudent:freshStudent,currentTeacher:teacher,studentId:sid,teacherCode:tid,teacherStudents,subjectStudents,addExam,addAssignment,addLesson,addAttendance,addFinalResult,studentItems,submitWork,gradeManual,registerAttendance,records,teacherSubmissions,refreshLeaderboard,normalizeAll};
 document.addEventListener("DOMContentLoaded",normalizeAll);
})();
