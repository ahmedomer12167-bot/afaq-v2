/* =========================================================
   AFAQ SUBSCRIPTION APPROVAL SYSTEM
   الطالب لا يدخل إلا بعد موافقة المدير وإضافة كود الطالب
   ========================================================= */
(function(){
  function read(key){
    try{return JSON.parse(localStorage.getItem(key)) || [];}catch(e){return [];}
  }
  function write(key,value){
    localStorage.setItem(key, JSON.stringify(value || []));
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }
  function getSetting(key, fallback){
    return localStorage.getItem(key) || fallback || "";
  }
  function setSetting(key,value){
    localStorage.setItem(key, value || "");
    window.dispatchEvent(new Event("afaqDataUpdated"));
  }
  function clean(v){return String(v || "").trim();}
  function now(){return new Date().toLocaleString("ar");}
  function id(prefix){return prefix + "-" + Date.now() + "-" + Math.floor(Math.random()*9999);}

  function students(){return read("afaq_students");}
  function requests(){return read("afaq_subscription_requests");}

  function saveStudents(list){write("afaq_students", list);}
  function saveRequests(list){write("afaq_subscription_requests", list);}

  function getMasterNumber(){
    return getSetting("afaq_master_number", "07800000000");
  }
  function setMasterNumber(value){
    setSetting("afaq_master_number", clean(value));
  }

  function submitRequest(data){
    const req = {
      id:id("subreq"),
      studentName:clean(data.studentName),
      parentName:clean(data.parentName),
      grade:clean(data.grade),
      amount:clean(data.amount),
      masterNumber:getMasterNumber(),
      status:"قيد المراجعة",
      studentCode:"",
      adminNote:"",
      createdAt:now()
    };

    if(!req.studentName || !req.parentName || !req.grade || !req.amount){
      throw new Error("يرجى ملء جميع حقول الاستمارة");
    }

    const list = requests();
    list.unshift(req);
    saveRequests(list);

    if(window.AfaqData && AfaqData.addNotification){
      AfaqData.addNotification("admin","admin","طلب اشتراك جديد","وصل طلب اشتراك من الطالب: " + req.studentName,"اشتراكات",req.grade);
    }

    return req;
  }

  function approveRequest(requestId, code){
    const list = requests();
    const req = list.find(r => r.id === requestId);
    if(!req) throw new Error("الطلب غير موجود");

    const studentCode = clean(code);
    if(!studentCode) throw new Error("أدخل كود الطالب قبل الموافقة");

    const existing = students().find(s => clean(s.code) === studentCode || clean(s.studentCode) === studentCode);
    if(existing) throw new Error("هذا الكود مستخدم لطالب آخر");

    req.status = "مقبول";
    req.studentCode = studentCode;
    req.approvedAt = now();

    saveRequests(list);

    const st = {
      id:"student-" + Date.now(),
      studentId:studentCode,
      code:studentCode,
      name:req.studentName,
      studentName:req.studentName,
      parentName:req.parentName,
      guardianName:req.parentName,
      grade:req.grade,
      amount:req.amount,
      subscriptionStatus:"مفعل",
      subscriptionRequestId:req.id,
      subjects:[],
      points:0,
      level:"مبتدئ",
      createdAt:now()
    };

    const all = students();
    all.unshift(st);
    saveStudents(all);

    if(window.AfaqData && AfaqData.addNotification){
      AfaqData.addNotification("student",studentCode,"تم قبول اشتراكك","تم قبول طلبك. يمكنك الدخول الآن باستخدام كود الطالب.","اشتراكات",req.grade);
    }

    return st;
  }

  function rejectRequest(requestId, note){
    const list = requests();
    const req = list.find(r => r.id === requestId);
    if(!req) throw new Error("الطلب غير موجود");

    req.status = "مرفوض";
    req.adminNote = clean(note);
    req.rejectedAt = now();

    saveRequests(list);

    if(window.AfaqData && AfaqData.addNotification){
      AfaqData.addNotification("student",req.studentName,"تم رفض طلب الاشتراك","تم رفض طلب الاشتراك. " + (req.adminNote || ""),"اشتراكات",req.grade);
    }

    return req;
  }

  function loginStudent(code){
    const c = clean(code);
    const st = students().find(s =>
      clean(s.code) === c ||
      clean(s.studentCode) === c ||
      clean(s.studentId) === c
    );

    if(!st) throw new Error("لا يوجد طالب مفعل بهذا الكود. أرسل طلب اشتراك وانتظر موافقة المدير.");
    if(clean(st.subscriptionStatus) !== "مفعل") throw new Error("حساب الطالب غير مفعل بعد موافقة المدير.");

    localStorage.setItem("afaq_current_student", JSON.stringify(st));
    return st;
  }

  window.AfaqSubscription = {
    read, write, clean,
    getMasterNumber, setMasterNumber,
    students, requests,
    submitRequest, approveRequest, rejectRequest, loginStudent
  };
})();
