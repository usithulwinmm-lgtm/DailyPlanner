// ၁။ Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.onclick = () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    darkModeToggle.innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
};

// --- အသံဖြင့်စာရိုက်သည့်စနစ် (Voice Recognition) ---
const startBtn = document.getElementById('startBtn');
const taskInput = document.getElementById('taskInput');

// Speech Recognition API ကို စစ်ဆေးခြင်း
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'my-MM'; 
    recognition.interimResults = false;
    recognition.continuous = true; // မရပ်မချင်း ဆက်တိုက်နားထောင်ရန်

    let isListening = false;

    startBtn.onclick = () => {
        if (!isListening) {
            recognition.start();
            isListening = true;
            startBtn.innerText = "🛑 ရပ်တန့်မည်";
            startBtn.style.background = "#ff4757";
            showToast("စတင်နားထောင်နေပါပြီ... ပြောလိုသည်များကို ဆက်တိုက်ပြောနိုင်ပါသည်။");
        } else {
            recognition.stop();
            isListening = false;
            startBtn.innerText = "🎤 အသံနဲ့ပြောမယ်";
            startBtn.style.background = "#3498db";
        }
    };

    recognition.onresult = (event) => {
        const deadline = document.getElementById('taskDeadline').value; //
        const category = document.getElementById('taskCategory').value; //
        
        // နောက်ဆုံးပြောလိုက်တဲ့ စာသားကို ယူခြင်း
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                const transcript = event.results[i][0].transcript.trim();
                
                if (transcript !== "") {
                    // Task အဖြစ် သိမ်းဆည်းခြင်း
                    const task = {
                        id: "task-" + Date.now() + i, // Unique ID ဖြစ်စေရန် i ပေါင်းထည့်ခြင်း
                        text: transcript,
                        deadline: deadline,
                        category: category,
                        completed: false,
                        remark: ""
                    };

                    saveTask(task); //
                    renderAllTasks(); //
                    showToast(`"${transcript}" ကို ထည့်သွင်းပြီးပါပြီ။`);
                }
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech error:", event.error);
        isListening = false;
        startBtn.innerText = "🎤 အသံနဲ့ပြောမယ်";
        startBtn.style.background = "#3498db";
    };

    recognition.onend = () => {
        // အကယ်၍ Stop ခလုတ်မနှိပ်ဘဲ Error ကြောင့်ဖြစ်စေ၊ ခေတ္တရပ်သွားပါက ပြန်စစေချင်လျှင်
        if (isListening) recognition.start();
    };
} else {
    startBtn.style.display = "none"; // Browser က support မလုပ်ရင် ခလုတ်ဖျောက်ထားမယ်
    console.log("Your browser does not support Speech Recognition.");
}

// ၂။ Task အသစ်ထည့်ခြင်း
const addBtn = document.getElementById('addBtn');
addBtn.onclick = () => {
    const text = document.getElementById('taskInput').value;
    const deadline = document.getElementById('taskDeadline').value;
    const category = document.getElementById('taskCategory').value;

    if (!text) return;

    const task = {
        id: "task-" + Date.now(),
        text: text,
        deadline: deadline,
        category: category,
        completed: false,
        remark: ""
    };

    saveTask(task);
    renderAllTasks(); // တစ်ခုတည်း Render မလုပ်ဘဲ အားလုံးကို Update ဖြစ်အောင် ခေါ်လိုက်ပါ
    showToast("Task အသစ်ကို ထည့်သွင်းပြီးပါပြီ။"); // Toast ပြခြင်း
    document.getElementById('taskInput').value = "";
};

// ၃။ LocalStorage သိမ်းဆည်းခြင်း
function saveTask(task) {
    let tasks = JSON.parse(localStorage.getItem('proTasks') || "[]");
    tasks.push(task);
    localStorage.setItem('proTasks', JSON.stringify(tasks));
}

// ၅။ Inline Edit ပြုလုပ်ပြီး သိမ်းဆည်းခြင်း
function saveInlineEdit(id, element, field) {
    let tasks = JSON.parse(localStorage.getItem('proTasks'));
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;

    if (field === 'text') tasks[index].text = element.innerText;
    else if (field === 'deadline') tasks[index].deadline = element.innerText;
    else if (field === 'remark') tasks[index].remark = element.innerText;
    
    localStorage.setItem('proTasks', JSON.stringify(tasks));
}

// ၆။ အမှန်ခြစ် ခြစ်ခြင်း (Status Update)
function toggleComplete(id) {
    let tasks = JSON.parse(localStorage.getItem('proTasks'));
    const index = tasks.findIndex(t => t.id === id);
    tasks[index].completed = !tasks[index].completed;
    localStorage.setItem('proTasks', JSON.stringify(tasks));

    renderAllTasks(); // Progress bar နဲ့ style တွေ update ဖြစ်ဖို့ ပြန် render လုပ်ပါ
}

// ၇။ Task ဖျက်ခြင်း
function deleteTask(id) {
    let tasks = JSON.parse(localStorage.getItem('proTasks'));
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('proTasks', JSON.stringify(tasks));
    
    renderAllTasks(); // Table ကို ပြန်ဆွဲထုတ်ခြင်း (Sorting နဲ့ Empty state ပြန်စစ်ရန်)
    showToast("Task ကို ဖျက်လိုက်ပါပြီ။");
}

function updateRowNumbers(category) {
    const rows = document.querySelectorAll(`#${category}List tr`);
    rows.forEach((row, index) => {
        row.querySelector('.row-no').innerText = index + 1;
    });
}

// ၈။ Category Filter
function filterCategory(cat) {
const categories = ['daily', 'weekly', 'monthly', 'yearly']; // Updated
    categories.forEach(item => {
        const el = document.getElementById(item);
        if (cat === 'all') el.style.display = "block";
        else el.style.display = (item === cat) ? "block" : "none";
    });

    // Active button color change
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.toLowerCase().includes(cat)) btn.classList.add('active');
    });
}

// ၉။ Search Function
function searchTasks() {
    let filter = document.getElementById('searchInput').value.toLowerCase();
    let rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        let text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
}

// ၁၀။ PDF ထုတ်ခြင်း
function exportToPDF() {
    const element = document.querySelector('.task-board');
    html2pdf().from(element).save('My-Tasks.pdf');
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

function getAllTasks() {
    let tasks = JSON.parse(localStorage.getItem('proTasks') || "[]");
    // Deadline အလိုက် စီခြင်း (အနီးဆုံးက အပေါ်ဆုံး)
    return tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
}

function checkDeadline(deadline) {
    if (!deadline) return "";
    const today = new Date().setHours(0,0,0,0);
    const taskDate = new Date(deadline).getTime();
    return taskDate < today ? "deadline-urgent" : "";
}

function updateDashboard(category) {
    const tasks = JSON.parse(localStorage.getItem('proTasks') || "[]");
    const catTasks = tasks.filter(t => t.category === category);
    const tbody = document.getElementById(`${category}List`);
    
    // Empty State Check
    if (catTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Task မရှိသေးပါ။</td></tr>`;
    }

    // Progress Calculation
    const completed = catTasks.filter(t => t.completed).length;
    const percent = catTasks.length > 0 ? (completed / catTasks.length) * 100 : 0;
    document.getElementById(`${category}Progress`).style.width = percent + "%";
}

function backupTasks() {
    const tasks = localStorage.getItem('proTasks');
    const blob = new Blob([tasks], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toLocaleDateString()}.json`;
    a.click();
    showToast("Data များကို Backup လုပ်ပြီးပါပြီ။");
}

function restoreTasks(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        localStorage.setItem('proTasks', e.target.result);
        location.reload(); // Data အသစ်များကို ပြရန် Refresh လုပ်ခြင်း
    };
    reader.readAsText(file);
}

function renderAllTasks() {
    const categories = ['daily', 'weekly', 'monthly', 'yearly']; // Updated
    categories.forEach(cat => {
        const listElement = document.getElementById(`${cat}List`);
        if (listElement) {
            listElement.innerHTML = "";
            updateDashboard(cat);
        }
    });

    const tasks = getAllTasks();
    tasks.forEach((task, index) => {
        const tbody = document.getElementById(`${task.category}List`);
        if (!tbody) return;
        
        // Empty state ကို ဖယ်ရှားပြီး task အစစ်ထည့်ခြင်း
        if(tbody.innerText === "Task မရှိသေးပါ။") tbody.innerHTML = "";

        const tr = document.createElement('tr');
        tr.id = task.id;
        const urgentClass = checkDeadline(task.deadline);
        
        tr.innerHTML = `
            <td class="row-no">${tbody.rows.length + 1}</td>
            <td contenteditable="true" onblur="saveInlineEdit('${task.id}', this, 'text')" class="${task.completed ? 'completed-task' : ''}">
                <strong>${task.text}</strong>
            </td>
            <td contenteditable="true" onblur="saveInlineEdit('${task.id}', this, 'deadline')" class="${urgentClass}">
                ${task.deadline || '-'}
            </td>
            <td style="text-align:center;">
                <input type="checkbox" class="status-checkbox" ${task.completed ? 'checked' : ''} onclick="toggleComplete('${task.id}')">
            </td>
            <td contenteditable="true" onblur="saveInlineEdit('${task.id}', this, 'remark')">${task.remark || ''}</td>
            <td class="task-actions">
                <span style="cursor:pointer; color: #ff4757;" onclick="deleteTask('${task.id}')">❌ Delete</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Deadline နီးကပ်နေသော Task များကို စစ်ဆေးပြီး Notification ပို့ပေးရန်
function checkReminders() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const tasks = JSON.parse(localStorage.getItem('proTasks') || "[]");
    const today = new Date().toISOString().split('T')[0]; // ယနေ့ရက်စွဲ (YYYY-MM-DD)

    tasks.forEach(task => {
        // အကယ်၍ task က မပြီးသေးဘူးဖြစ်ပြီး deadline က ဒီနေ့ဖြစ်နေရင်
        if (!task.completed && task.deadline === today) {
            new Notification("Task Reminder! 📅", {
                body: `ယနေ့လုပ်ဆောင်ရမည့်အလုပ်: ${task.text}`,
                icon: "https://cdn-icons-png.flaticon.com/512/3176/3176395.png" // Icon တစ်ခုခု ထည့်ပေးနိုင်သည်
            });
        }
    });
}

// ၁ နာရီတစ်ခါ အလိုအလျောက် စစ်ဆေးစေချင်လျှင် (Optional)
setInterval(checkReminders, 3600000);

// --- ဤနေရာတွင် logic အသစ်များ အစားထိုးပါ ---

window.onload = () => {
    if(localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerText = "☀️ Light Mode";
    }
    
    // ၁။ Deadline မှာ Today ကို Default ထားခြင်း
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDeadline').value = today;

    if ("Notification" in window) {
        Notification.requestPermission();
    }

    renderAllTasks();
    checkReminders();
};

function renderAllTasks() {
    const categories = ['daily', 'weekly', 'monthly', 'yearly'];
    categories.forEach(cat => {
        const listElement = document.getElementById(`${cat}List`);
        if (listElement) {
            listElement.innerHTML = "";
            updateDashboard(cat);
        }
    });

    const tasks = getAllTasks();
    tasks.forEach((task) => {
        const tbody = document.getElementById(`${task.category}List`);
        if (!tbody) return;
        
        if(tbody.innerText === "Task မရှိသေးပါ။") tbody.innerHTML = "";

        const tr = document.createElement('tr');
        tr.id = task.id;
        const urgentClass = checkDeadline(task.deadline);
        
        // Row ကို နှိပ်ရင် Modal ပွင့်စေဖို့
        tr.onclick = (e) => {
            // Checkbox ကို နှိပ်ရင် Modal မပွင့်စေဖို့ စစ်ဆေးခြင်း
            if (e.target.type !== 'checkbox') {
                openEditModal(task);
            }
        };

        tr.innerHTML = `
            <td style="text-align:center;">
                <input type="checkbox" class="status-checkbox" ${task.completed ? 'checked' : ''} 
                onclick="event.stopPropagation(); toggleComplete('${task.id}')">
            </td>
            <td class="${task.completed ? 'completed-task' : ''}">
                <strong>${task.text}</strong>
            </td>
            <td class="${urgentClass}">
                ${task.deadline || '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// updateDashboard function ထဲမှ colspan ကို 3 သို့ပြောင်းရန် (Table column နည်းသွားသောကြောင့်)
function updateDashboard(category) {
    const tasks = JSON.parse(localStorage.getItem('proTasks') || "[]");
    const catTasks = tasks.filter(t => t.category === category);
    const tbody = document.getElementById(`${category}List`);
    
    if (catTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">Task မရှိသေးပါ။</td></tr>`;
    }

    const completed = catTasks.filter(t => t.completed).length;
    const percent = catTasks.length > 0 ? (completed / catTasks.length) * 100 : 0;
    document.getElementById(`${category}Progress`).style.width = percent + "%";
}

const modal = document.getElementById('editModal');

function openEditModal(task) {
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskText').value = task.text;
    document.getElementById('editTaskDeadline').value = task.deadline;
    modal.style.display = "flex";
}

function closeModal() {
    modal.style.display = "none";
}

// Modal အပြင်ဘက်ကို နှိပ်ရင် ပိတ်ဖို့
window.onclick = (event) => {
    if (event.target == modal) closeModal();
};

function updateTaskFromModal() {
    const id = document.getElementById('editTaskId').value;
    const newText = document.getElementById('editTaskText').value;
    const newDeadline = document.getElementById('editTaskDeadline').value;

    let tasks = JSON.parse(localStorage.getItem('proTasks'));
    const index = tasks.findIndex(t => t.id === id);
    
    if (index !== -1) {
        tasks[index].text = newText;
        tasks[index].deadline = newDeadline;
        localStorage.setItem('proTasks', JSON.stringify(tasks));
        renderAllTasks();
        closeModal();
        showToast("ပြင်ဆင်ပြီးပါပြီ။");
    }
}

function deleteTaskFromModal() {
    const id = document.getElementById('editTaskId').value;
    
    // confirm မမေးတော့ဘဲ တန်းဖျက်မည်
    deleteTask(id);
    closeModal();
}

