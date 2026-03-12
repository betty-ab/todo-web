// Elements
const input = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const taskList = document.getElementById("task-list");
const dueDateInput = document.getElementById("due-date");
const priorityInput = document.getElementById("priority");
const recurrenceInput = document.getElementById("recurrence");
const filterBtns = document.querySelectorAll(".filters button");
const sortBtns = document.querySelectorAll(".sort-options button");
const searchInput = document.getElementById("search-input");
const toast = document.getElementById("toast");
const darkToggle = document.getElementById("dark-mode-toggle");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Save tasks
function saveTasks() { localStorage.setItem("tasks", JSON.stringify(tasks)); }

// Toast notifications
function showToast(msg, type="info") {
  toast.textContent = msg;
  toast.className = "toast show";
  switch(type) {
    case "success": toast.style.backgroundColor="green"; break;
    case "error": toast.style.backgroundColor="red"; break;
    case "warning": toast.style.backgroundColor="orange"; break;
    default: toast.style.backgroundColor="#333"; break;
  }
  setTimeout(() => toast.classList.remove("show"), 2000);
}

// Render tasks
function renderTasks(filter="all") {
  taskList.innerHTML="";
  const today = new Date().toISOString().split("T")[0];
  const searchTerm = searchInput.value.toLowerCase();

  // Sort tasks: completed last, then priority, then due date
  const priorityValue = { "High":3, "Medium":2, "Low":1 };
  const sortedTasks = [...tasks].sort((a,b)=>{
    if(a.completed!==b.completed) return a.completed-b.completed;
    if(priorityValue[b.priority]!==priorityValue[a.priority]) return priorityValue[b.priority]-priorityValue[a.priority];
    if(a.dueDate && b.dueDate) return new Date(a.dueDate)-new Date(b.dueDate);
    return 0;
  });

  sortedTasks.forEach((task,index)=>{
    if(filter==="completed" && !task.completed) return;
    if(filter==="pending" && task.completed) return;
    if(!task.text.toLowerCase().includes(searchTerm)) return;

    const li = document.createElement("li");
    li.dataset.index = index;
    li.className = task.completed ? "completed":"";

    // Priority color
    switch(task.priority){
      case "High": li.style.borderLeft="4px solid red"; break;
      case "Medium": li.style.borderLeft="4px solid orange"; break;
      case "Low": li.style.borderLeft="4px solid green"; break;
    }

    // Highlight due date
    if(task.dueDate){
      const due = new Date(task.dueDate);
      const now = new Date();
      if(due < now.setHours(0,0,0,0)) li.style.backgroundColor="#ffe6e6";
      else if(task.dueDate===today) li.style.backgroundColor="#fff8b3";
    }

    // Task details
    const details=document.createElement("div");
    details.className="task-details";
    details.innerHTML=`<strong>${task.text}</strong> | Priority: ${task.priority} | Due: ${task.dueDate||'N/A'}`;
    li.appendChild(details);

    // Complete toggle
    li.addEventListener("click",(e)=>{
      if(e.target.classList.contains("delete-btn") || e.target.classList.contains("edit-btn")) return;
      task.completed=!task.completed;

      // Recurring tasks
      if(task.completed && task.recurrence && task.recurrence!=="None"){
        let newDueDate;
        if(task.dueDate){
          const date=new Date(task.dueDate);
          switch(task.recurrence){
            case "Daily": date.setDate(date.getDate()+1); break;
            case "Weekly": date.setDate(date.getDate()+7); break;
            case "Monthly": date.setMonth(date.getMonth()+1); break;
          }
          newDueDate = date.toISOString().split("T")[0];
        }
        tasks.push({ text:task.text, dueDate:newDueDate, priority:task.priority, completed:false, recurrence:task.recurrence });
        showToast("Recurring task created for next period!", "success");
      }

      saveTasks();
      renderTasks(filter);
      showToast(task.completed ? "Task completed!":"Task marked pending!", "success");
    });

    // Inline edit
    const editBtn=document.createElement("button");
    editBtn.textContent="Edit";
    editBtn.className="edit-btn";
    editBtn.addEventListener("click",(e)=>{
      e.stopPropagation();
      const textDiv = details.querySelector("strong");
      const inputEdit=document.createElement("input");
      inputEdit.type="text";
      inputEdit.value=task.text;
      textDiv.replaceWith(inputEdit);
      inputEdit.focus();
      inputEdit.addEventListener("keypress",(ev)=>{if(ev.key==="Enter"){task.text=inputEdit.value.trim()||task.text; saveTasks(); renderTasks(filter); showToast("Task updated!","warning");}});
      inputEdit.addEventListener("blur",()=>{task.text=inputEdit.value.trim()||task.text; saveTasks(); renderTasks(filter); showToast("Task updated!","warning");});
    });
    li.appendChild(editBtn);

    // Delete
    const deleteBtn=document.createElement("button");
    deleteBtn.textContent="Delete";
    deleteBtn.className="delete-btn";
    deleteBtn.addEventListener("click",(e)=>{
      e.stopPropagation();
      li.classList.add("removing");
      setTimeout(()=>{
        tasks.splice(index,1);
        saveTasks();
        renderTasks(filter);
        showToast("Task deleted!","error");
      },300);
    });
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
  });
}

// Add task
addBtn.addEventListener("click",()=>{
  const text=input.value.trim();
  const dueDate=dueDateInput.value;
  const priority=priorityInput.value;
  const recurrence=recurrenceInput.value;
  const today=new Date().toISOString().split("T")[0];
  if(!text) return;
  if(dueDate && dueDate<today){ alert("Due date cannot be in the past!"); return;}
  tasks.push({ text, dueDate, priority, completed:false, recurrence });
  saveTasks();
  renderTasks();
  input.value=""; dueDateInput.value=""; priorityInput.value="Medium"; recurrenceInput.value="None";
  showToast("Task added!","success");
});

// Filters
filterBtns.forEach(btn=>btn.addEventListener("click",()=>renderTasks(btn.dataset.filter)));

// Sort
sortBtns.forEach(btn=>btn.addEventListener("click",()=>{sortTasks(btn.dataset.sort); renderTasks();}));

function sortTasks(criteria){
  const priorityValue={High:3, Medium:2, Low:1};
  tasks.sort((a,b)=>{
    switch(criteria){
      case "due": if(!a.dueDate) return 1; if(!b.dueDate) return -1; return new Date(a.dueDate)-new Date(b.dueDate);
      case "priority": return priorityValue[b.priority]-priorityValue[a.priority];
      case "status": return a.completed-b.completed;
    }
  });
  saveTasks();
}

// Search
searchInput.addEventListener("input",()=>renderTasks());

// Dark Mode
darkToggle.addEventListener("click",()=>document.body.classList.toggle("dark-mode"));

// Export JSON
document.getElementById("export-btn").addEventListener("click",()=>{
  const dataStr=JSON.stringify(tasks,null,2);
  const blob=new Blob([dataStr],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download="tasks.json"; a.click();
});

// Drag & Drop
new Sortable(taskList,{ animation:150, onEnd:()=>{ const updated=[]; taskList.querySelectorAll("li").forEach(li=>updated.push(tasks[li.dataset.index])); tasks=updated; saveTasks(); renderTasks();}});

// Initial render
renderTasks();