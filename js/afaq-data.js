/* =========================================================
   AFAQ REAL DATA START - NO DEMO DATA
   هذا الملف يربط بيانات المنصة بدون أي بيانات تجريبية.
   المصدر الحقيقي:
   المدير ← الطلاب والاشتراكات
   المدرس ← الموافقة على المادة + الدروس + النتائج + الحضور
   الطالب ← طلب اشتراك + طلب دخول مادة
   ولي الأمر ← مشاهدة بيانات الطالب فقط
   ========================================================= */

(function(){
const K = {
  students:"afaq_students",
  teachers:"afaq_teachers",
  lessons:"afaq_lessons",
  exams:"afaq_exams",
  assignments:"afaq_assignments",
  attendance:"afaq_attendance",
  results:"afaq_results",
  messages:"afaq_messages",
  notifications:"afaq_notifications",
  subscriptionRequests:"afaq_subscription_requests",
  subjectRequests:"afaq_subject_requests",
  currentStudentId:"afaq_current_student_id",
  currentStudent:"afaq_current_student",
  currentSubject:"afaq_current_subject"
};

function clean(v){return String(v ?? "").trim();}
function read(key,fallback=[]){try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch(e){return fallback;}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event("afaqDataUpdated"));}

function defaultPhoto(){
return "data:image/svg+xml;utf8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><rect width='100%' height='100%' rx='70' fill='#7c3aed'/><text x='50%' y='58%' text-anchor='middle' font-size='54' fill='white'>👨‍🎓</text></svg>`);
}

function normalizeStudent(s={}){
const id = clean(s.studentId || s.id || s.code || ("STD-" + Date.now()));
let subjects = s.subjects || [];
if(typeof subjects === "string"){
  subjects = subjects.split(",").map(x=>clean(x)).filter(Boolean);
}
return {
  studentId:id,
  id,
  code:clean(s.code || id),
  name:clean(s.name || s.studentName || ""),
  grade:clean(s.grade || s.studentGrade || ""),
  phone:clean(s.phone || s.studentPhone || ""),
  parentName:clean(s.parentName || ""),
  parentPhone:clean(s.parentPhone || ""),
  notes:clean(s.notes || ""),
  photo:s.photo || defaultPhoto(),
  subscriptionStatus:clean(s.subscriptionStatus || "غير مفعل"),
  subscriptionEnd:clean(s.subscriptionEnd || "غير محدد"),
  subjects,
  createdAt:s.createdAt || new Date().toLocaleString("ar")
};
}

function allStudents(){return read(K.students,[]).map(normalizeStudent);}
function saveStudents(list){write(K.students,(list||[]).map(normalizeStudent));}

function upsertStudent(student){
const item = normalizeStudent(student);
const list = allStudents();
const index = list.findIndex(s=>s.studentId===item.studentId || s.code===item.code);
if(index >= 0) list[index] = {...list[index], ...item};
else list.unshift(item);
saveStudents(list);
return item;
}

function removeStudent(id){
saveStudents(allStudents().filter(s=>s.studentId!==id && s.code!==id));
}

function findStudent(code){
const c = clean(code);
return allStudents().find(s=>clean(s.code)===c || clean(s.studentId)===c || clean(s.id)===c) || null;
}

function setCurrentStudent(student){
const st = normalizeStudent(student);
localStorage.setItem(K.currentStudentId, st.studentId);
localStorage.setItem(K.currentStudent, JSON.stringify(st));
}

function getCurrentStudent(){
const id = clean(localStorage.getItem(K.currentStudentId));
const students = allStudents();
if(id){
  const found = students.find(s=>s.studentId===id || s.code===id);
  if(found){
    localStorage.setItem(K.currentStudent, JSON.stringify(found));
    return found;
  }
}
const cached = read(K.currentStudent,null);
return cached ? normalizeStudent(cached) : null;
}

function list(name){
return read(K[name] || name, []);
}

function save(name, data){
write(K[name] || name, data || []);
}

function add(name,item){
const arr = list(name);
const newItem = {id:item.id || name + "-" + Date.now(), createdAt:new Date().toLocaleString("ar"), ...item};
arr.unshift(newItem);
save(name,arr);
return newItem;
}

function update(name,id,patch){
const arr = list(name);
const i = arr.findIndex(x=>x.id===id);
if(i >= 0){
  arr[i] = {...arr[i], ...patch};
  save(name,arr);
  return arr[i];
}
return null;
}

function remove(name,id){
save(name, list(name).filter(x=>x.id!==id));
}

function getCurrentSubject(){
return clean(localStorage.getItem(K.currentSubject));
}

function setCurrentSubject(subject){
localStorage.setItem(K.currentSubject, clean(subject));
}

function subjectItems(name,subject){
const sub = clean(subject || getCurrentSubject());
return list(name).filter(x=>!x.subject || clean(x.subject)===sub);
}

function studentItems(name,studentId){
const st = getCurrentStudent();
const sid = clean(studentId || st?.studentId || st?.code);
return list(name).filter(x=>!x.studentId || clean(x.studentId)===sid || clean(x.code)===sid);
}

function hasActiveSubscription(student){
return student && clean(student.subscriptionStatus) === "مفعل";
}

function canEnterSubject(student,subject){
if(!student) return false;
return (student.subjects || []).map(clean).includes(clean(subject));
}

function renderCurrentStudent(){
const st = getCurrentStudent();
if(!st) return null;

const txt = (id,val)=>{
  const el = document.getElementById(id);
  if(el) el.textContent = val || "-";
};

const img = (id,val)=>{
  const el = document.getElementById(id);
  if(el) el.src = val || defaultPhoto();
};

img("studentPhotoView", st.photo);
txt("studentNameView", st.name);
txt("studentGradeView", st.grade);
txt("studentNameInfo", st.name);
txt("studentGradeInfo", st.grade);
txt("studentPhoneInfo", st.phone);
txt("studentCodeInfo", st.code);
txt("parentNameInfo", st.parentName);
txt("parentPhoneInfo", st.parentPhone);
txt("studentNotesInfo", st.notes);
txt("subscriptionStatusInfo", st.subscriptionStatus);
txt("subscriptionEndInfo", st.subscriptionEnd);

const subjectsBox = document.getElementById("subjectsList");
if(subjectsBox){
  subjectsBox.innerHTML = (st.subjects || []).length
  ? st.subjects.map(s=>`<span class="badge">${s}</span>`).join("")
  : `<span class="badge">لا توجد مواد مفعلة</span>`;
}
return st;
}

function resetAllData(){
Object.values(K).forEach(key=>localStorage.removeItem(key));
[
"afaq_student_results",
"afaq_student_attendance",
"afaq_student_messages",
"afaq_student_notifications",
"afaq_teacher_lessons",
"afaq_teacher_exams",
"afaq_teacher_assignments",
"afaq_teacher_attendance",
"afaq_teacher_results"
].forEach(key=>localStorage.removeItem(key));
}

window.AfaqData = {
  K, clean, read, write,
  defaultPhoto,
  normalizeStudent, allStudents, saveStudents, upsertStudent, removeStudent, findStudent,
  setCurrentStudent, getCurrentStudent,
  list, save, add, update, remove,
  getCurrentSubject, setCurrentSubject, subjectItems, studentItems,
  hasActiveSubscription, canEnterSubject,
  renderCurrentStudent, resetAllData
};
})();
