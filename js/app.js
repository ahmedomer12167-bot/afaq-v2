function scrollToAccounts() {
  const accountsSection = document.getElementById("accounts");

  if (accountsSection) {
    accountsSection.scrollIntoView({
      behavior: "smooth"
    });
  }
}

/*
  لاحقاً عند ربط Firebase سنستبدل هذه الأرقام ببيانات حقيقية مباشرة.
*/

const demoStats = {
  students: 0,
  teachers: 0,
  subjects: 8,
  quizzes: 0
};

function updateStats() {
  const studentsCount = document.getElementById("studentsCount");
  const teachersCount = document.getElementById("teachersCount");
  const subjectsCount = document.getElementById("subjectsCount");
  const quizzesCount = document.getElementById("quizzesCount");

  if (studentsCount) studentsCount.textContent = demoStats.students;
  if (teachersCount) teachersCount.textContent = demoStats.teachers;
  if (subjectsCount) subjectsCount.textContent = demoStats.subjects;
  if (quizzesCount) quizzesCount.textContent = demoStats.quizzes;
}

updateStats();

/* الشريط العلوي الذكي */
const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 60) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

/* زر العودة للأعلى */
const backBtn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 400) {
    backBtn.style.display = "block";
  } else {
    backBtn.style.display = "none";
  }
});

backBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

console.log("Afaq Education v2 Landing Page Loaded");
