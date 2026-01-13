// PlansiteOS v3.0 Logic
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const addBtn = document.getElementById('add-task');
const toggle = document.getElementById('theme-toggle');

function addTask() {
  if (!input.value.trim()) return;
  const li = document.createElement('li');
  li.textContent = input.value;
  li.onclick = () => li.classList.toggle('done');
  list.appendChild(li);
  input.value = '';
}

addBtn.onclick = addTask;
input.addEventListener('keypress', e => e.key === 'Enter' && addTask());

toggle.onclick = () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark'));
};

if (localStorage.getItem('theme') === 'true') {
  document.body.classList.add('dark');
}
