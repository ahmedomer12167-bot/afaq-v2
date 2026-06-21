/* =========================================================
   AFAQ FULL PLATFORM ZIP BACKUP
   ينشئ ZIP يحتوي ملفات المنصة + بيانات localStorage
   يتحدث في كل مرة تضغط إنشاء النسخة
   ملاحظة: المواقع الثابتة لا تسمح بقراءة المجلد تلقائياً، لذلك نستخدم قائمة ملفات Manifest
   ========================================================= */
(function(){
  const DEFAULT_FILES = [
    "index.html",

    "css/main.css",
    "css/afaq-purple-mobile.css",
    "css/afaq-badges.css",
    "css/afaq-3d-dashboard.css",
    "css/afaq-panel.css",
    "css/afaq-room.css",
    "css/afaq-home-clean.css",
    "css/afaq-home-hover-clean.css",
    "css/afaq-student-complete.css",
    "css/afaq-admin-control.css",
    "css/afaq-sync-final.css",
    "css/afaq-builder-final.css",
    "css/afaq-subject-join.css",
    "css/afaq-subscription.css",
    "css/afaq-messages.css",

    "js/app.js",
    "js/afaq-data.js",
    "js/afaq-unified-counters.js",
    "js/afaq-badges.js",
    "js/afaq-auto-stats.js",
    "js/afaq-admin-read-tools.js",
    "js/afaq-teacher-auth.js",
    "js/afaq-complete-sync.js",
    "js/afaq-real-sync.js",
    "js/afaq-exam-builder.js",
    "js/afaq-backup-zip.js",
    "js/afaq-admin-control.js",
    "js/afaq-central-data.js",
    "js/afaq-central-bridge.js",
    "js/afaq-final-counters.js",
    "js/afaq-subscription.js",
    "js/afaq-full-sync.js",
    "js/afaq-subject-join.js",
    "js/afaq-messages.js",

    "pages/admin-dashboard.html",
    "pages/admin-control.html",
    "pages/admin-student-registry.html",
    "pages/admin-backup.html",
    "pages/admin-full-backup.html",
    "pages/admin-messages.html",
    "pages/admin-subscriptions.html",
    "pages/subscription-requests-management.html",
    "pages/admin-subject-requests.html",
    "pages/students-management.html",
    "pages/teachers-management.html",
    "pages/subjects-management.html",

    "pages/teacher-dashboard.html",
    "pages/teacher-login.html",
    "pages/teacher-lessons.html",
    "pages/teacher-exams.html",
    "pages/teacher-assignments.html",
    "pages/teacher-exam-questions.html",
    "pages/teacher-assignment-questions.html",
    "pages/teacher-attendance.html",
    "pages/teacher-results.html",
    "pages/teacher-subject-requests.html",
    "pages/teacher-messages.html",
    "pages/teacher-notifications.html",

    "pages/student-login.html",
    "pages/student-dashboard.html",
    "pages/student-profile.html",
    "pages/student-subjects.html",
    "pages/student-subject-room.html",
    "pages/student-lessons.html",
    "pages/student-exams.html",
    "pages/student-assignments.html",
    "pages/student-attendance.html",
    "pages/student-results.html",
    "pages/student-notifications.html",
    "pages/student-messages.html",
    "pages/student-leaderboard.html",

    "pages/parent-dashboard.html",
    "pages/parent-login.html",
    "pages/parent-student-info.html",
    "pages/parent-results.html",
    "pages/parent-attendance.html",
    "pages/parent-exams.html",
    "pages/parent-assignments.html",
    "pages/parent-messages.html",
    "pages/parent-notifications.html",
    "pages/parent-reports.html"
  ];

  function u16(n){return [n&255,(n>>>8)&255];}
  function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];}

  function crc32(buf){
    let c = ~0;
    for(let i=0;i<buf.length;i++){
      c ^= buf[i];
      for(let k=0;k<8;k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
    }
    return (~c) >>> 0;
  }

  function makeZip(files){
    let chunks = [];
    let central = [];
    let offset = 0;
    const enc = new TextEncoder();

    files.forEach(f=>{
      const name = enc.encode(f.name);
      const data = typeof f.content === "string" ? enc.encode(f.content) : f.content;
      const crc = crc32(data);

      const local = [
        ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0),
        ...u16(0), ...u16(0), ...u32(crc),
        ...u32(data.length), ...u32(data.length),
        ...u16(name.length), ...u16(0)
      ];
      chunks.push(new Uint8Array([...local, ...name, ...data]));

      const cent = [
        ...u32(0x02014b50), ...u16(20), ...u16(20),
        ...u16(0), ...u16(0), ...u16(0), ...u16(0),
        ...u32(crc), ...u32(data.length), ...u32(data.length),
        ...u16(name.length), ...u16(0), ...u16(0),
        ...u16(0), ...u16(0), ...u32(0), ...u32(offset)
      ];
      central.push(new Uint8Array([...cent, ...name]));
      offset += local.length + name.length + data.length;
    });

    const centralStart = offset;
    central.forEach(c=> offset += c.length);

    const end = new Uint8Array([
      ...u32(0x06054b50), ...u16(0), ...u16(0),
      ...u16(files.length), ...u16(files.length),
      ...u32(offset - centralStart), ...u32(centralStart), ...u16(0)
    ]);

    return new Blob([...chunks, ...central, end], {type:"application/zip"});
  }

  async function fetchText(path){
    const res = await fetch("../" + path + "?v=" + Date.now(), {cache:"no-store"});
    if(!res.ok) throw new Error("not found");
    return await res.text();
  }

  function localStorageBackupFiles(){
    const files = [];
    for(let i=0;i<localStorage.length;i++){
      const key = localStorage.key(i);
      if(key && key.startsWith("afaq_")){
        files.push({
          name:"database/" + key + ".json",
          content:localStorage.getItem(key) || ""
        });
      }
    }
    return files;
  }

  async function createFullBackup(){
    const statusBox = document.getElementById("backupStatus");
    const fileListBox = document.getElementById("backupFilesList");
    if(statusBox) statusBox.innerHTML = "جاري إنشاء النسخة...";
    if(fileListBox) fileListBox.innerHTML = "";

    const zipFiles = [];
    const missing = [];

    for(const file of DEFAULT_FILES){
      try{
        const content = await fetchText(file);
        zipFiles.push({name:file, content});
        if(fileListBox) fileListBox.innerHTML += `<div class="ok">✓ ${file}</div>`;
      }catch(e){
        missing.push(file);
        if(fileListBox) fileListBox.innerHTML += `<div class="bad">× غير موجود: ${file}</div>`;
      }
    }

    zipFiles.push(...localStorageBackupFiles());

    zipFiles.push({
      name:"README.txt",
      content:
`نسخة كاملة من منصة آفاق التعليمية
تاريخ النسخة: ${new Date().toLocaleString("ar")}
عدد ملفات المشروع المحفوظة: ${zipFiles.length}
عدد الملفات غير الموجودة: ${missing.length}

ملاحظة:
النسخة تتحدث في كل مرة تضغط زر إنشاء النسخة.
إذا أضفت ملفات جديدة للمشروع، أضف أسماءها داخل DEFAULT_FILES في js/afaq-full-platform-backup.js.
`
    });

    zipFiles.push({
      name:"missing-files.json",
      content:JSON.stringify(missing, null, 2)
    });

    const blob = makeZip(zipFiles);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "afaq-full-platform-" + new Date().toISOString().slice(0,10) + ".zip";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);

    if(statusBox){
      statusBox.innerHTML = `
        تم إنشاء النسخة بنجاح.<br>
        الملفات المحفوظة: <b>${zipFiles.length}</b><br>
        الملفات غير الموجودة: <b>${missing.length}</b>
      `;
    }
  }

  window.AfaqFullPlatformBackup = {
    createFullBackup,
    DEFAULT_FILES
  };
})();
