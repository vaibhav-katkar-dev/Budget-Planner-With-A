  // Simulated fetch data from backend
  const user = {
    name: "Vaibhav",
    email: "vaibhav@example.com",
    avatar: "/uploads/default.png",
    totalBudget: 8000,
    totalSpent: 4500,
    budgets: [
      { category: "Food", amount: 2500 },
      { category: "Rent", amount: 3000 }
    ],
    categorySpend: {
      Food: 1800,
      Rent: 2700
    }
  };

  // Inject data into UI
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-email').textContent = user.email;
  document.getElementById('user-avatar').src = user.avatar;
  document.getElementById('total-budget').textContent = user.totalBudget;

  document.getElementById('summary-budget').textContent = user.totalBudget;
  document.getElementById('summary-spent').textContent = user.totalSpent;

  const budgetList = document.getElementById('budget-list');
  user.budgets.forEach(b => {
    const li = document.createElement('li');
    li.textContent = `${b.category}: ₹${b.amount}`;
    budgetList.appendChild(li);
  });

  const spendingList = document.getElementById('spending-list');
  for (let cat in user.categorySpend) {
    const li = document.createElement('li');
    li.textContent = `${cat}: ₹${user.categorySpend[cat]}`;
    spendingList.appendChild(li);
  }

  // Modal functions
  function openEditModal() {
    document.getElementById('editModal').style.display = 'block';
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-email').value = user.email;
  }

  function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
  }

  function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
  }

  function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
  }

  // Optional: Add `submit` event listeners to forms
  document.getElementById('edit-profile-form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert("Profile updated (simulation).");
    closeEditModal();
  });
///this is for change password
  document.getElementById('password-form').addEventListener('submit', function (e) {
    e.preventDefault();
    let oldPass=document.querySelector("#oldPass");
let newPass=document.querySelector("#newPass");

console.log(oldPass.value,newPass.value);
    alert("Password changed (simulation).");
    closePasswordModal();
  });

  document.getElementById('delete-form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert("Account deleted (simulation).");
  });

//change password
// let passBtn=document.querySelector("#passBtn");
// passBtn.addEventListener("click",()=>{
//     chanegPass();
// });


// let chanegPass=()=>{
// let oldPass=document.querySelector("#oldPass");
// let newPass=document.querySelector("#newPass");

// console.log(oldPass.value,newPass.value);
// }