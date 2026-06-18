function scrollToAccounts() {
  document.getElementById("accounts").scrollIntoView({
    behavior: "smooth"
  });
}

/*
  لاحقاً عند ربط Firebase سنستبدل هذه الأرقام ببيانات حقيقية مباشرة.
  حالياً هذه دالة تجريبية فقط حتى تبدو الإحصائيات حية.
*/

const demoStats = {
  students: 0,
  teachers: 0,
  subjects: 8,
  quizzes: 0
};

function updateStats() {
  document.getElementById("studentsCount").textContent = demoStats.students;
  document.getElementById("teachersCount").textContent = demoStats.teachers;
  document.getElementById("subjectsCount").textContent = demoStats.subjects;
  document.getElementById("quizzesCount").textContent = demoStats.quizzes;
}

updateStats();

console.log("Afaq Education v2 Landing Page Loaded");
