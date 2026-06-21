
(function(){
const K={
students:"afaq_students",teachers:"afaq_teachers",subjects:"afaq_subjects",
subscriptionRequests:"afaq_subscription_requests",subjectRequests:"afaq_subject_requests",
lessons:"afaq_lessons",files:"afaq_files",exams:"afaq_exams",assignments:"afaq_assignments",
attendance:"afaq_attendance",results:"afaq_results",finalResults:"afaq_final_results",
leaderboard:"afaq_leaderboard",messages:"afaq_messages",notifications:"afaq_notifications",
currentStudentId:"afaq_current_student_id",currentStudent:"afaq_current_student",currentSubject:"afaq_current_subject",currentTeacher:"afaq_current_teacher"
};
const clean=v=>String(v??"").trim();
function read(key,fallback=[]){try{return JSON.parse(localStorage.getItem(key))??fallback}catch(e){return fallback}}
function write(key,val){localStorage.setItem(key,JSON.stringify(val));window.dispatchEvent(new Event("afaqDataUpdated"))}
function list(name){return read(K[name]||name,[])} function save(name,arr){write(K[name]||name,arr||[])}
function add(name,item){const arr=list(name);const it={id:item.id||name+"-"+Date.now(),createdAt:new Date().toLocaleString("ar"),...item};arr.unshift(it);save(name,arr);return it}
function update(name,id,patch){const arr=list(name);const i=arr.findIndex(x=>x.id===id);if(i>=0){arr[i]={...arr[i],...patch};save(name,arr);return arr[i]}return null}
function remove(name,id){save(name,list(name).filter(x=>x.id!==id))}
function defaultPhoto(){return "data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><rect width='100%' height='100%' rx='70' fill='#7c3aed'/><text x='50%' y='58%' text-anchor='middle' font-size='54' fill='white'>👨‍🎓</text></svg>`)}
function normStudent(s={}){
let subjects=s.subjects||[]; if(typeof subjects==="string") subjects=subjects.split(",").map(clean).filter(Boolean);
const id=clean(s.studentId||s.id||s.code||("STD-"+Date.now()));
return {studentId:id,id,code:clean(s.code||id),name:clean(s.name||""),grade:clean(s.grade||""),phone:clean(s.phone||""),parentName:clean(s.parentName||""),parentPhone:clean(s.parentPhone||""),notes:clean(s.notes||""),photo:s.photo||defaultPhoto(),subscriptionStatus:clean(s.subscriptionStatus||"غير مفعل"),subscriptionEnd:clean(s.subscriptionEnd||"غير محدد"),subjects,createdAt:s.createdAt||new Date().toLocaleString("ar")};
}
function allStudents(){return list("students").map(normStudent)} function saveStudents(arr){save("students",arr.map(normStudent))}
function upsertStudent(s){const it=normStudent(s),arr=allStudents();const i=arr.findIndex(x=>x.studentId===it.studentId||x.code===it.code);if(i>=0)arr[i]={...arr[i],...it};else arr.unshift(it);saveStudents(arr);return it}
function findStudent(code){const c=clean(code);return allStudents().find(s=>s.code===c||s.studentId===c)||null}
function setCurrentStudent(s){const st=normStudent(s);localStorage.setItem(K.currentStudentId,st.studentId);localStorage.setItem(K.currentStudent,JSON.stringify(st))}
function getCurrentStudent(){const id=clean(localStorage.getItem(K.currentStudentId));const arr=allStudents();if(id){const f=arr.find(s=>s.studentId===id||s.code===id);if(f){localStorage.setItem(K.currentStudent,JSON.stringify(f));return f}}const c=read(K.currentStudent,null);return c?normStudent(c):null}
function addNotification(toRole,toId,title,message,type="عام",subject=""){return add("notifications",{toRole,toId,title,message,type,subject,read:false})}
function notifyAdmin(title,msg,type){return addNotification("admin","admin",title,msg,type)}
function notifyStudent(studentId,title,msg,type,subject=""){return addNotification("student",studentId,title,msg,type,subject)}
function notifyTeacher(teacherCode,title,msg,type,subject=""){return addNotification("teacher",teacherCode,title,msg,type,subject)}
function getNotifications(role,id){return list("notifications").filter(n=>(!n.toRole||n.toRole===role)&&(!n.toId||n.toId===id||n.toId==="admin"))}
function subjects(){return list("subjects")} function upsertSubject(sub){const arr=subjects();const id=sub.id||sub.name;const i=arr.findIndex(x=>x.id===id||x.name===sub.name);const it={id,name:sub.name,grade:sub.grade||"",teacherCode:sub.teacherCode||"",teacherName:sub.teacherName||"",createdAt:sub.createdAt||new Date().toLocaleString("ar")};if(i>=0)arr[i]={...arr[i],...it};else arr.unshift(it);save("subjects",arr);return it}
function approveSubscription(requestId){const reqs=list("subscriptionRequests");const r=reqs.find(x=>x.id===requestId);if(!r)return null;const code=r.studentCode||("STD-"+Date.now().toString().slice(-6));const st=upsertStudent({studentId:code,code,name:r.name,grade:r.grade,phone:r.phone,parentName:r.parentName,parentPhone:r.parentPhone,notes:r.notes,subscriptionStatus:"مفعل",subjects:[]});r.status="تمت الموافقة";r.studentCode=code;save("subscriptionRequests",reqs);notifyStudent(st.studentId,"تم قبول الاشتراك","تم تفعيل اشتراكك. كود الدخول: "+code,"اشتراك");return st}
function approveSubjectRequest(requestId){const reqs=list("subjectRequests");const r=reqs.find(x=>x.id===requestId);if(!r)return null;const arr=allStudents();const i=arr.findIndex(s=>s.studentId===r.studentId||s.code===r.code);if(i>=0){arr[i].subjects=arr[i].subjects||[];if(!arr[i].subjects.includes(r.subject))arr[i].subjects.push(r.subject);saveStudents(arr);r.status="تمت الموافقة";save("subjectRequests",reqs);notifyStudent(arr[i].studentId,"تم قبول المادة","تمت الموافقة على دخول مادة "+r.subject,"مادة",r.subject);return arr[i]}return null}
function setCurrentSubject(subject){localStorage.setItem(K.currentSubject,clean(subject))} function getCurrentSubject(){return clean(localStorage.getItem(K.currentSubject))}
function hasActiveSubscription(st){return st&&st.subscriptionStatus==="مفعل"} function canEnterSubject(st,subject){return !!(st&&(st.subjects||[]).map(clean).includes(clean(subject)))}
function scoped(name,{studentId="",subject="",teacherCode=""}={}){return list(name).filter(x=>(!studentId||!x.studentId||x.studentId===studentId||x.code===studentId)&&(!subject||!x.subject||x.subject===subject)&&(!teacherCode||!x.teacherCode||x.teacherCode===teacherCode))}
function studentsInSubject(subject){return allStudents().filter(s=>(s.subjects||[]).includes(subject))}
function renderCurrentStudent(){const st=getCurrentStudent();if(!st)return null;const txt=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v||"-"};const img=(id,v)=>{const e=document.getElementById(id);if(e)e.src=v||defaultPhoto()};img("studentPhotoView",st.photo);txt("studentNameView",st.name);txt("studentGradeView",st.grade);txt("studentCodeInfo",st.code);txt("subscriptionStatusInfo",st.subscriptionStatus);return st}
function resetAll(){Object.keys(localStorage).filter(k=>k.startsWith("afaq_")).forEach(k=>localStorage.removeItem(k))}
window.AfaqData={K,clean,read,write,list,save,add,update,remove,defaultPhoto,normStudent,allStudents,saveStudents,upsertStudent,findStudent,setCurrentStudent,getCurrentStudent,addNotification,notifyAdmin,notifyStudent,notifyTeacher,getNotifications,subjects,upsertSubject,approveSubscription,approveSubjectRequest,setCurrentSubject,getCurrentSubject,hasActiveSubscription,canEnterSubject,scoped,studentsInSubject,renderCurrentStudent,resetAll};
})();
