/* AFAQ TEACHER SECURE AUTH
   نظام دخول المدرس:
   - المدير فقط يضيف المدرس
   - لكل مدرس: الاسم الثلاثي + الصف + المادة + كود المدرس + كود المادة
   - المدرس يدخل بكود المدرس وكود المادة فقط
   - يتم حفظ المدرس الحالي في afaq_current_teacher
   - صفحات المدرس تعرض بيانات المدرس الحالي فقط
*/
(function(){
  function clean(v){return String(v || "").trim();}

  function read(key){
    try{return JSON.parse(localStorage.getItem(key)) || [];}catch(e){return [];}
  }

  function write(key,val){
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }

  function teachers(){
    return read("afaq_teachers");
  }

  function saveTeachers(list){
    write("afaq_teachers", list || []);
  }

  function makeTeacherId(){
    return "TCH-" + Date.now().toString().slice(-6);
  }

  function normalizeTeacher(t){
    const teacherCode = clean(t.teacherCode || t.code || "");
    const subjectCode = clean(t.subjectCode || "");
    return {
      id: clean(t.id || teacherCode || makeTeacherId()),
      teacherId: clean(t.teacherId || t.id || teacherCode || makeTeacherId()),
      fullName: clean(t.fullName || t.name || t.teacherName || ""),
      name: clean(t.fullName || t.name || t.teacherName || ""),
      grade: clean(t.grade || ""),
      subject: clean(t.subject || ""),
      teacherCode,
      code: teacherCode,
      subjectCode,
      phone: clean(t.phone || ""),
      notes: clean(t.notes || ""),
      status: clean(t.status || "مفعل"),
      createdAt: t.createdAt || new Date().toLocaleString("ar")
    };
  }

  function upsertTeacher(t){
    const item = normalizeTeacher(t);
    const list = teachers().map(normalizeTeacher);
    const index = list.findIndex(x =>
      x.teacherCode === item.teacherCode ||
      x.id === item.id ||
      x.teacherId === item.teacherId
    );

    if(index >= 0) list[index] = {...list[index], ...item};
    else list.unshift(item);

    saveTeachers(list);

    // ربط المادة بالمدرس داخل afaq_subjects
    const subjects = read("afaq_subjects");
    const old = subjects.findIndex(s =>
      clean(s.name) === item.subject &&
      clean(s.grade) === item.grade
    );

    const subjectItem = {
      id: item.subject + "-" + item.grade,
      name: item.subject,
      grade: item.grade,
      teacherCode: item.teacherCode,
      teacherName: item.fullName,
      subjectCode: item.subjectCode,
      createdAt: new Date().toLocaleString("ar")
    };

    if(old >= 0) subjects[old] = {...subjects[old], ...subjectItem};
    else subjects.unshift(subjectItem);

    write("afaq_subjects", subjects);

    return item;
  }

  function deleteTeacher(teacherCode){
    const c = clean(teacherCode);
    saveTeachers(teachers().filter(t => clean(t.teacherCode || t.code) !== c));
  }

  function loginTeacher(teacherCode, subjectCode){
    const tCode = clean(teacherCode);
    const sCode = clean(subjectCode);

    const teacher = teachers().map(normalizeTeacher).find(t =>
      t.teacherCode === tCode &&
      t.subjectCode === sCode &&
      t.status === "مفعل"
    );

    if(!teacher) return null;

    localStorage.setItem("afaq_current_teacher", JSON.stringify(teacher));
    localStorage.setItem("afaq_current_teacher_code", teacher.teacherCode);
    localStorage.setItem("afaq_current_subject", teacher.subject);
    localStorage.setItem("afaq_current_subject_code", teacher.subjectCode);
    return teacher;
  }

  function currentTeacher(){
    try{
      return normalizeTeacher(JSON.parse(localStorage.getItem("afaq_current_teacher")) || {});
    }catch(e){return null;}
  }

  function requireTeacher(){
    const t = currentTeacher();
    if(!t || !t.teacherCode || !t.subjectCode){
      location.href = "teacher-login.html";
      return null;
    }
    return t;
  }

  function teacherScopedList(key){
    const t = currentTeacher();
    const arr = read("afaq_" + key);
    if(!t) return [];
    return arr.filter(x =>
      clean(x.teacherCode) === t.teacherCode ||
      clean(x.subjectCode) === t.subjectCode ||
      clean(x.subject) === t.subject
    );
  }

  function addTeacherScoped(key,item){
    const t = requireTeacher();
    if(!t) return null;

    const arr = read("afaq_" + key);
    const newItem = {
      id: key + "-" + Date.now(),
      createdAt: new Date().toLocaleString("ar"),
      teacherCode: t.teacherCode,
      teacherName: t.fullName,
      subjectCode: t.subjectCode,
      subject: t.subject,
      grade: t.grade,
      ...item
    };

    arr.unshift(newItem);
    write("afaq_" + key, arr);
    return newItem;
  }

  function logoutTeacher(){
    localStorage.removeItem("afaq_current_teacher");
    localStorage.removeItem("afaq_current_teacher_code");
    localStorage.removeItem("afaq_current_subject_code");
    location.href = "teacher-login.html";
  }

  window.AfaqTeacherAuth = {
    clean,
    read,
    write,
    teachers,
    saveTeachers,
    normalizeTeacher,
    upsertTeacher,
    deleteTeacher,
    loginTeacher,
    currentTeacher,
    requireTeacher,
    teacherScopedList,
    addTeacherScoped,
    logoutTeacher
  };
})();
