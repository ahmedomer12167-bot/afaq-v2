/* AFAQ DATA - Student real link layer */
(function(){
const K={
students:"afaq_students",
currentId:"afaq_current_student_id",
current:"afaq_current_student"
};

function defaultPhoto(){
return "data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><rect width='100%' height='100%' rx='70' fill='#7c3aed'/><text x='50%' y='58%' text-anchor='middle' font-size='54' fill='white'>👨‍🎓</text></svg>`);
}

function safeParse(key,fallback){
try{return JSON.parse(localStorage.getItem(key)) || fallback;}catch(e){return fallback;}
}

function clean(v){return String(v || "").trim();}

function getStudents(){
return safeParse(K.students,[]);
}

function saveStudents(students){
localStorage.setItem(K.students,JSON.stringify(students || []));
}

function normalizeStudent(st){
if(!st)return null;
const id=clean(st.studentId || st.id || st.code || ("STD-"+Date.now()));
return {
studentId:id,
id:id,
code:clean(st.code || id),
name:clean(st.name || st.studentName || "طالب"),
grade:clean(st.grade || st.studentGrade || "غير محدد"),
phone:clean(st.phone || st.studentPhone || "-"),
parentName:clean(st.parentName || "-"),
parentPhone:clean(st.parentPhone || "-"),
notes:clean(st.notes || st.studentNotes || "لا توجد ملاحظات"),
photo:st.photo || defaultPhoto(),
subscriptionStatus:clean(st.subscriptionStatus || st.subscription || "غير مفعل"),
subscriptionEnd:clean(st.subscriptionEnd || st.endDate || "غير محدد"),
subjects:st.subjects || ["الأحياء","الكيمياء","الفيزياء"],
createdAt:st.createdAt || ""
};
}

function allStudents(){
return getStudents().map(normalizeStudent).filter(Boolean);
}

function findStudentByCodeAndGrade(code,grade){
const c=clean(code);
const g=clean(grade);
const list=allStudents();
return list.find(s=>clean(s.code)===c && clean(s.grade)===g) ||
       list.find(s=>clean(s.studentId)===c && clean(s.grade)===g) ||
       list.find(s=>clean(s.code)===c) ||
       list.find(s=>clean(s.studentId)===c) ||
       null;
}

function setCurrentStudent(student){
const st=normalizeStudent(student);
if(!st)return;
localStorage.setItem(K.currentId,st.studentId);
localStorage.setItem(K.current,JSON.stringify(st));
}

function getCurrentStudent(){
const id=clean(localStorage.getItem(K.currentId));
const list=allStudents();
if(id){
const found=list.find(s=>clean(s.studentId)===id || clean(s.code)===id);
if(found){
localStorage.setItem(K.current,JSON.stringify(found));
return found;
}
}
const cached=safeParse(K.current,null);
if(cached)return normalizeStudent(cached);
return list[0] || null;
}

function upsertStudent(student){
const st=normalizeStudent(student);
let list=allStudents();
const i=list.findIndex(s=>clean(s.studentId)===clean(st.studentId) || clean(s.code)===clean(st.code));
if(i>=0) list[i]=st; else list.unshift(st);
saveStudents(list);
setCurrentStudent(st);
return st;
}

function deleteStudent(id){
let list=allStudents().filter(s=>clean(s.studentId)!==clean(id) && clean(s.code)!==clean(id));
saveStudents(list);
}

function renderCurrentStudent(){
const st=getCurrentStudent();
if(!st)return null;

const txt=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val || "-";};
const img=(id,val)=>{const el=document.getElementById(id); if(el) el.src=val || defaultPhoto();};

img("studentPhotoView",st.photo);
txt("studentNameView",st.name);
txt("studentGradeView",st.grade);
txt("studentNameInfo",st.name);
txt("studentGradeInfo",st.grade);
txt("studentPhoneInfo",st.phone);
txt("studentCodeInfo",st.code);
txt("parentNameInfo",st.parentName);
txt("parentPhoneInfo",st.parentPhone);
txt("studentNotesInfo",st.notes);
txt("subscriptionStatusInfo",st.subscriptionStatus);
txt("subscriptionEndInfo",st.subscriptionEnd);

const subjects=document.getElementById("subjectsList");
if(subjects){
subjects.innerHTML=(st.subjects||[]).map(s=>`<span class="badge">${s}</span>`).join("");
}
return st;
}

window.AfaqData={defaultPhoto,clean,getStudents,saveStudents,normalizeStudent,allStudents,findStudentByCodeAndGrade,setCurrentStudent,getCurrentStudent,upsertStudent,deleteStudent,renderCurrentStudent};
})();