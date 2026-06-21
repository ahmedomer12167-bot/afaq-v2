
/* AFAQ UNIFIED ADMIN CONTROLLED DATA - localStorage unified core */
(function(){
const K={
students:"afaq_students", teachers:"afaq_teachers", subjects:"afaq_subjects",
subscriptionRequests:"afaq_subscription_requests", subjectRequests:"afaq_subject_requests",
notifications:"afaq_notifications", messages:"afaq_messages",
lessons:"afaq_lessons", exams:"afaq_exams", assignments:"afaq_assignments", attendance:"afaq_attendance", results:"afaq_results",
currentStudentId:"afaq_current_student_id", currentStudent:"afaq_current_student", currentSubject:"afaq_current_subject", currentTeacher:"afaq_current_teacher"
};
const clean=v=>String(v??"").trim();
function read(key,fallback=[]){try{return JSON.parse(localStorage.getItem(key))??fallback}catch(e){return fallback}}
function write(key,val){localStorage.setItem(key,JSON.stringify(val));window.dispatchEvent(new Event("afaqDataUpdated"))}
function defaultPhoto(){return "data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><rect width='100%' height='100%' rx='70' fill='#7c3aed'/><text x='50%' y='58%' text-anchor='middle' font-size='54' fill='white'>👨‍🎓</text></svg>`)}
function normalizeStudent(s={}){
 let subjects=s.subjects||[]; if(typeof subjects==="string") subjects=subjects.split(",").map(clean).filter(Boolean);
 const id=clean(s.studentId||s.id||s.code||("STD-"+Date.now()));
 return {studentId:id,id,code:clean(s.code||id),name:clean(s.name||""),grade:clean(s.grade||""),phone:clean(s.phone||""),parentName:clean(s.parentName||""),parentPhone:clean(s.parentPhone||""),notes:clean(s.notes||""),photo:s.photo||defaultPhoto(),subscriptionStatus:clean(s.subscriptionStatus||"غير مفعل"),subscriptionEnd:clean(s.subscriptionEnd||"غير محدد"),subjects,createdAt:s.createdAt||new Date().toLocaleString("ar")};
}
function normalizeTeacher(t={}){
 const id=clean(t.teacherId||t.id||t.code||("TCH-"+Date.now()));
 return {teacherId:id,id,code:clean(t.code||id),name:clean(t.name||""),grade:clean(t.grade||""),subject:clean(t.subject||""),phone:clean(t.phone||""),createdAt:t.createdAt||new Date().toLocaleString("ar")};
}
function list(name){return read(K[name]||name,[])}
function save(name,arr){write(K[name]||name,arr||[])}
function add(name,item){const arr=list(name);const it={id:item.id||name+"-"+Date.now(),createdAt:new Date().toLocaleString("ar"),...item};arr.unshift(it);save(name,arr);return it}
function update(name,id,patch){const arr=list(name);const i=arr.findIndex(x=>x.id===id);if(i>=0){arr[i]={...arr[i],...patch};save(name,arr);return arr[i]}return null}
function remove(name,id){save(name,list(name).filter(x=>x.id!==id))}
function allStudents(){return list("students").map(normalizeStudent)}
function saveStudents(arr){save("students",arr.map(normalizeStudent))}
function upsertStudent(s){const item=normalizeStudent(s);const arr=allStudents();const i=arr.findIndex(x=>x.studentId===item.studentId||x.code===item.code);if(i>=0)arr[i]={...arr[i],...item};else arr.unshift(item);saveStudents(arr);return item}
function findStudent(code){const c=clean(code);return allStudents().find(s=>s.code===c||s.studentId===c)||null}
function setCurrentStudent(s){const st=normalizeStudent(s);localStorage.setItem(K.currentStudentId,st.studentId);localStorage.setItem(K.currentStudent,JSON.stringify(st))}
function getCurrentStudent(){const id=clean(localStorage.getItem(K.currentStudentId));const arr=allStudents();if(id){const f=arr.find(s=>s.studentId===id||s.code===id);if(f){localStorage.setItem(K.currentStudent,JSON.stringify(f));return f}}const c=read(K.currentStudent,null);return c?normalizeStudent(c):null}
function allTeachers(){return list("teachers").map(normalizeTeacher)}
function saveTeachers(arr){save("teachers",arr.map(normalizeTeacher))}
function upsertTeacher(t){const item=normalizeTeacher(t);const arr=allTeachers();const i=arr.findIndex(x=>x.teacherId===item.teacherId||x.code===item.code);if(i>=0)arr[i]={...arr[i],...item};else arr.unshift(item);saveTeachers(arr);return item}
function addNotification(toRole,toId,title,message,type="عام"){return add("notifications",{toRole,toId,title,message,type,read:false})}
function getNotifications(role,id){return list("notifications").filter(n=>(!n.toRole||n.toRole===role)&&(!n.toId||n.toId===id))}
function subjects(){return list("subjects")}
function upsertSubject(sub){const arr=subjects();const id=sub.id||sub.name;const i=arr.findIndex(x=>x.id===id||x.name===sub.name);const item={id,name:sub.name,grade:sub.grade||"",teacherCode:sub.teacherCode||"",teacherName:sub.teacherName||"",createdAt:sub.createdAt||new Date().toLocaleString("ar")};if(i>=0)arr[i]={...arr[i],...item};else arr.unshift(item);save("subjects",arr);return item}
function teacherSubjects(teacherCode){return subjects().filter(s=>!teacherCode||s.teacherCode===teacherCode)}
function hasActiveSubscription(st){return st&&st.subscriptionStatus==="مفعل"}
function canEnterSubject(st,subject){return !!(st&&(st.subjects||[]).map(clean).includes(clean(subject)))}
function approveSubscription(requestId){
 const reqs=list("subscriptionRequests");const r=reqs.find(x=>x.id===requestId);if(!r)return null;
 const code=r.studentCode||("STD-"+Date.now().toString().slice(-6));
 const st=upsertStudent({studentId:code,code,name:r.name,grade:r.grade,phone:r.phone,parentName:r.parentName,parentPhone:r.parentPhone,notes:r.notes,subscriptionStatus:"مفعل",subjects:[]});
 r.status="تمت الموافقة";r.studentCode=code;save("subscriptionRequests",reqs);
 addNotification("student",st.studentId,"تم قبول الاشتراك","تم تفعيل اشتراكك. كود الدخول: "+code,"اشتراك");
 return st;
}
function approveSubjectRequest(requestId){
 const reqs=list("subjectRequests");const r=reqs.find(x=>x.id===requestId);if(!r)return null;
 const arr=allStudents();const i=arr.findIndex(s=>s.studentId===r.studentId||s.code===r.code);if(i>=0){arr[i].subjects=arr[i].subjects||[];if(!arr[i].subjects.includes(r.subject))arr[i].subjects.push(r.subject);saveStudents(arr);r.status="تمت الموافقة";save("subjectRequests",reqs);addNotification("student",arr[i].studentId,"تم قبول المادة","تمت الموافقة على دخول مادة "+r.subject,"مادة");return arr[i]}return null;
}
function setCurrentSubject(subject){localStorage.setItem(K.currentSubject,clean(subject))}
function getCurrentSubject(){return clean(localStorage.getItem(K.currentSubject))}
function renderCurrentStudent(){const st=getCurrentStudent();if(!st)return null;const txt=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v||"-"};const img=(id,v)=>{const e=document.getElementById(id);if(e)e.src=v||defaultPhoto()};img("studentPhotoView",st.photo);txt("studentNameView",st.name);txt("studentGradeView",st.grade);txt("studentCodeInfo",st.code);txt("subscriptionStatusInfo",st.subscriptionStatus);return st}
function resetAll(){Object.values(K).forEach(k=>localStorage.removeItem(k))}
function resetAll(){Object.keys(localStorage).filter(k=>k.startsWith('afaq_')).forEach(k=>localStorage.removeItem(k))}
window.AfaqData={resetAll,K,clean,read,write,list,save,add,update,remove,defaultPhoto,normalizeStudent,allStudents,saveStudents,upsertStudent,findStudent,setCurrentStudent,getCurrentStudent,normalizeTeacher,allTeachers,saveTeachers,upsertTeacher,addNotification,getNotifications,subjects,upsertSubject,teacherSubjects,hasActiveSubscription,canEnterSubject,approveSubscription,approveSubjectRequest,setCurrentSubject,getCurrentSubject,renderCurrentStudent,resetAll};
})();
