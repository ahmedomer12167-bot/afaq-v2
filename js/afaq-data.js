/* =========================================================
   AFAQ INTEGRATED DATA READY v1
   ربط بيانات المدير + المدرس + الطالب + ولي الأمر
   التخزين الحالي: localStorage داخل نفس المتصفح
   لاحقاً نستبدله بقاعدة بيانات حقيقية بنفس أسماء الدوال.
   ========================================================= */

(function(){
const K={
students:"afaq_students",
teachers:"afaq_teachers",
subjects:"afaq_subjects",
lessons:"afaq_lessons",
exams:"afaq_exams",
assignments:"afaq_assignments",
attendance:"afaq_attendance",
results:"afaq_results",
messages:"afaq_messages",
notifications:"afaq_notifications",
currentStudentId:"afaq_current_student_id",
currentStudent:"afaq_current_student",
currentTeacher:"afaq_current_teacher",
currentRole:"afaq_current_role"
};

function clean(v){return String(v ?? "").trim();}
function read(key,fallback=[]){try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch(e){return fallback;}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event("afaqDataUpdated"));}

function defaultPhoto(){
return "data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><rect width='100%' height='100%' rx='70' fill='#7c3aed'/><text x='50%' y='58%' text-anchor='middle' font-size='54' fill='white'>👨‍🎓</text></svg>`);
}

function compressImage(file, cb){
const reader=new FileReader();
reader.onload=e=>{
const img=new Image();
img.onload=()=>{
const c=document.createElement("canvas");
const max=140;
let w=img.width,h=img.height;
if(w>h && w>max){h=Math.round(h*max/w);w=max;}
if(h>=w && h>max){w=Math.round(w*max/h);h=max;}
c.width=w;c.height=h;
c.getContext("2d").drawImage(img,0,0,w,h);
let out=c.toDataURL("image/jpeg",0.45);
if(out.length>50000) out=defaultPhoto();
cb(out);
};
img.onerror=()=>cb(defaultPhoto());
img.src=e.target.result;
};
reader.readAsDataURL(file);
}

function normStudent(s={}){
const id=clean(s.studentId||s.id||s.code||("STD-"+Date.now()));
let subjects=s.subjects||["الأحياء"];
if(typeof subjects==="string") subjects=subjects.split(",").map(x=>clean(x)).filter(Boolean);
return {
studentId:id,id,code:clean(s.code||id),
name:clean(s.name||s.studentName||"طالب"),
grade:clean(s.grade||s.studentGrade||"غير محدد"),
phone:clean(s.phone||s.studentPhone||"-"),
parentName:clean(s.parentName||"-"),
parentPhone:clean(s.parentPhone||"-"),
notes:clean(s.notes||"لا توجد ملاحظات"),
photo:s.photo||defaultPhoto(),
subscriptionStatus:clean(s.subscriptionStatus||"غير مفعل"),
subscriptionEnd:clean(s.subscriptionEnd||"غير محدد"),
subjects,
createdAt:s.createdAt||new Date().toLocaleString("ar")
};
}

function normTeacher(t={}){
const id=clean(t.teacherId||t.id||t.code||("TCH-"+Date.now()));
return {
teacherId:id,id,code:clean(t.code||id),
name:clean(t.name||"مدرس"),
subject:clean(t.subject||"الأحياء"),
grade:clean(t.grade||"السادس العلمي"),
phone:clean(t.phone||"-"),
bio:clean(t.bio||""),
photo:t.photo||"",
createdAt:t.createdAt||new Date().toLocaleString("ar")
};
}

function list(key){return read(K[key]||key,[]);}
function save(key,arr){write(K[key]||key,arr||[]);}
function allStudents(){return list("students").map(normStudent);}
function saveStudents(arr){save("students",arr.map(normStudent));}
function upsertStudent(s){
const item=normStudent(s); const arr=allStudents();
const i=arr.findIndex(x=>x.studentId===item.studentId||x.code===item.code);
if(i>=0) arr[i]={...arr[i],...item}; else arr.unshift(item);
saveStudents(arr); setCurrentStudent(item); return item;
}
function removeStudent(id){saveStudents(allStudents().filter(x=>x.studentId!==id&&x.code!==id));}
function findStudent(code){const c=clean(code);return allStudents().find(s=>s.code===c||s.studentId===c||s.id===c)||null;}
function setCurrentStudent(s){const item=normStudent(s);localStorage.setItem(K.currentStudentId,item.studentId);localStorage.setItem(K.currentStudent,JSON.stringify(item));}
function getCurrentStudent(){
const id=clean(localStorage.getItem(K.currentStudentId));
const arr=allStudents();
if(id){const f=arr.find(s=>s.studentId===id||s.code===id);if(f){localStorage.setItem(K.currentStudent,JSON.stringify(f));return f;}}
const cached=read(K.currentStudent,null); return cached?normStudent(cached):(arr[0]||null);
}

function allTeachers(){return list("teachers").map(normTeacher);}
function saveTeachers(arr){save("teachers",arr.map(normTeacher));}
function upsertTeacher(t){
const item=normTeacher(t), arr=allTeachers();
const i=arr.findIndex(x=>x.teacherId===item.teacherId||x.code===item.code);
if(i>=0) arr[i]={...arr[i],...item}; else arr.unshift(item);
saveTeachers(arr); localStorage.setItem(K.currentTeacher,JSON.stringify(item)); return item;
}

function add(key,item){const arr=list(key); const it={id:item.id||key+"-"+Date.now(),createdAt:new Date().toLocaleString("ar"),...item}; arr.unshift(it); save(key,arr); return it;}
function update(key,id,patch){const arr=list(key); const i=arr.findIndex(x=>x.id===id); if(i>=0){arr[i]={...arr[i],...patch}; save(key,arr); return arr[i];} return null;}
function remove(key,id){save(key,list(key).filter(x=>x.id!==id));}

function subjectItems(key,subject="الأحياء"){const sub=clean(subject);return list(key).filter(x=>!x.subject||clean(x.subject)===sub);}
function studentItems(key,studentId){const st=getCurrentStudent(); const sid=clean(studentId||st?.studentId||st?.code);return list(key).filter(x=>!x.studentId||clean(x.studentId)===sid||clean(x.code)===sid);}

function renderCurrentStudent(){
const st=getCurrentStudent(); if(!st)return null;
const txt=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v||"-";};
const img=(id,v)=>{const e=document.getElementById(id); if(e)e.src=v||defaultPhoto();};
img("studentPhotoView",st.photo);
txt("studentNameView",st.name); txt("studentGradeView",st.grade);
txt("studentNameInfo",st.name); txt("studentGradeInfo",st.grade);
txt("studentPhoneInfo",st.phone); txt("studentCodeInfo",st.code);
txt("parentNameInfo",st.parentName); txt("parentPhoneInfo",st.parentPhone);
txt("studentNotesInfo",st.notes); txt("subscriptionStatusInfo",st.subscriptionStatus);
txt("subscriptionEndInfo",st.subscriptionEnd);
const subjects=document.getElementById("subjectsList");
if(subjects)subjects.innerHTML=(st.subjects||[]).map(s=>`<span class="badge">${s}</span>`).join("");
return st;
}

function seed(){
if(allStudents().length===0){
upsertStudent({code:"11",name:"طالب تجريبي",grade:"السادس العلمي",parentName:"ولي الأمر",subscriptionStatus:"مفعل",subjects:["الأحياء","الكيمياء","الفيزياء"]});
}
if(list("lessons").length===0)add("lessons",{subject:"الأحياء",title:"درس تجريبي",description:"هذا درس ظاهر للطالب وولي الأمر",status:"منشور",type:"PDF"});
if(list("exams").length===0)add("exams",{subject:"الأحياء",title:"اختبار تجريبي",status:"منشور",total:100});
if(list("assignments").length===0)add("assignments",{subject:"الأحياء",title:"واجب تجريبي",status:"منشور",degree:20,dueDate:"غير محدد"});
if(list("attendance").length===0)add("attendance",{subject:"الأحياء",studentId:"11",studentName:"طالب تجريبي",date:new Date().toLocaleDateString("ar"),status:"حاضر"});
if(list("results").length===0)add("results",{subject:"الأحياء",studentId:"11",studentName:"طالب تجريبي",title:"نتيجة تجريبية",score:88,total:100,type:"نهائي"});
}

window.AfaqData={K,clean,read,write,defaultPhoto,compressImage,
normStudent,allStudents,saveStudents,upsertStudent,removeStudent,findStudent,setCurrentStudent,getCurrentStudent,
normTeacher,allTeachers,saveTeachers,upsertTeacher,
list,save,add,update,remove,subjectItems,studentItems,renderCurrentStudent,seed};
})();