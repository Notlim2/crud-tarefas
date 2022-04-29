class Tasks {
  create(newTask) {
    const tasks = this.get();
    const newTaskId = tasks.length
      ? Math.max(...tasks.map((task) => task.id ?? 0)) + 1
      : 1;
    window.localStorage.setItem(
      "tasks",
      JSON.stringify([...tasks, { ...newTask, id: newTaskId }])
    );
  }

  get(taskName) {
    let tasks = JSON.parse(window.localStorage.getItem("tasks") || "[]") || [];

    if (taskName) {
      tasks = tasks.filter((task) =>
        (task.name ?? "Sem Nome").includes(taskName)
      );
    }

    return tasks;
  }

  getOne(taskId) {
    const tasks = this.get();
    return tasks.find((task) => task.id === taskId);
  }

  update(taskId, newTask) {
    const tasks = this.get();
    window.localStorage.setItem(
      "tasks",
      JSON.stringify([...tasks.filter((task) => task.id !== taskId), newTask])
    );
  }

  delete(taskId) {
    const tasks = this.get();
    window.localStorage.setItem(
      "tasks",
      JSON.stringify([...tasks.filter((task) => task.id !== taskId)])
    );
  }
}

const tasks = new Tasks();

function clearRows() {
  const tasksBody = document.getElementById("tasksBody");
  const rows = Array.from(tasksBody.getElementsByTagName("tr"));
  for (const row of rows) {
    row.remove();
  }
}

function renderTasks(allTasks = tasks.get()) {
  clearRows();

  const tasksTable = document.getElementById("tasksBody");

  for (const task of allTasks) {
    // Insere uma nova linha ao final da tabela
    const newRow = tasksTable.insertRow(-1);

    const idCell = newRow.insertCell(0);
    idCell.innerText = task.id;

    const nameCell = newRow.insertCell(1);
    nameCell.innerText = task.name;

    const createdAtCell = newRow.insertCell(2);
    createdAtCell.innerText = task.createdAt;

    const finishedAtCell = newRow.insertCell(3);
    finishedAtCell.innerText = task.finishedAt ?? "Não Finalizado";

    const actionsCell = newRow.insertCell(4);
    const shouldRenderFinishButton = !task.finishedAt;
    actionsCell.innerHTML = `
        <button type="button" onclick="renderEditTask(${
          task.id
        })">Editar</button>
        ${
          shouldRenderFinishButton
            ? `<button type="button" class="success" onclick="askFinishTask(${task.id})">Finalizar</button>`
            : ""
        }
        <button type="button" class="danger" onclick="askRemoveTask(${
          task.id
        })">Remover</button>
    `;
  }
}

function handleCreateOrEditTask(event) {
  // Impede que o submit atualize a página
  event.preventDefault();

  if (idOfEditingTask) {
    updateTask();
  } else {
    createTask();
  }
}

function createTask() {
  const nameInput = document.getElementById("new-task-name");
  const name = nameInput.value || "Sem Nome";

  const dataAtual = new Date(Date.now());
  const createdAt = formatDate(dataAtual);

  tasks.create({ name, createdAt });

  renderTasks();
  hideCreateOrEditTask();
  renderMessage("Tarefa criada com sucesso!", "success");

  nameInput.value = "";
}

function updateTask() {
  const nameInput = document.getElementById("new-task-name");
  const name = nameInput.value ?? "Sem Nome";

  const task = tasks.getOne(idOfEditingTask);
  tasks.update(idOfEditingTask, { ...task, name });

  renderTasks();
  hideCreateOrEditTask();
  renderMessage("Tarefa atualizada com sucesso!", "success");

  nameInput.value = "";
  idOfEditingTask = undefined;
}

function formatDate(date) {
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
}

function renderCreateTask() {
  const newTaskNameModal = document.getElementById("new-task-name-modal");

  const createTaskTitle = document.getElementById("create-task-title");
  createTaskTitle.innerText = "Criar Tarefa";

  const nameInput = document.getElementById("new-task-name");
  nameInput.value = "";

  newTaskNameModal.style.display = "flex";
}

function hideCreateOrEditTask() {
  const newTaskNameModal = document.getElementById("new-task-name-modal");
  newTaskNameModal.style.display = "none";
}

function renderEditTask(taskId) {
  idOfEditingTask = taskId;

  const newTaskNameModal = document.getElementById("new-task-name-modal");

  const createTaskTitle = document.getElementById("create-task-title");
  createTaskTitle.innerText = "Editar Tarefa";

  const task = tasks.getOne(taskId);
  const nameInput = document.getElementById("new-task-name");
  nameInput.value = task.name;

  newTaskNameModal.style.display = "flex";
}

async function askRemoveTask(taskId) {
  try {
    await new Promise(function (resolve, reject) {
      renderQuestion(
        `Deseja remover a tarefa de número: ${taskId}?`,
        resolve,
        reject
      );
    });

    tasks.delete(taskId);

    renderTasks();
    renderMessage("Tarefa removida com sucesso!", "success");
  } catch (error) {
    if (error) {
      renderMessage(error.message, "error");
    }
  }
}

async function askFinishTask(taskId) {
  try {
    await new Promise(function (resolve, reject) {
      renderQuestion(
        `Deseja finalizar a tarefa de número: ${taskId}?`,
        resolve,
        reject
      );
    });

    const task = tasks.getOne(taskId);
    const actualDate = new Date(Date.now());
    task.finishedAt = formatDate(actualDate);
    tasks.update(taskId, task);

    renderTasks();
    renderMessage("Tarefa finalizada!", "success");
  } catch (error) {
    if (error) {
      renderMessage(error.message, "error");
    }
  }
}

function filterTasks(event) {
  event.preventDefault();

  const taskSearchInput = document.getElementById("task-search");

  const filteredTasks = tasks.get(taskSearchInput.value);
  renderTasks(filteredTasks);
}

function renderQuestion(question, onOk, onCancel) {
  const newModal = document.createElement("div");
  newModal.classList.add("modal");
  newModal.style.display = "flex";
  newModal.addEventListener("click", () => {
    onCancel();
    newModal.remove();
  });

  const modalContent = document.createElement("div");
  const questionText = document.createElement("p");
  questionText.innerText = question;
  questionText.style.paddingBottom = "8px";
  questionText.style.fontSize = "1.4em";
  questionText.style.fontWeight = "600";

  const okButton = document.createElement("button");
  okButton.classList.add("success");
  okButton.innerText = "Ok";
  okButton.addEventListener("click", () => {
    onOk();
    newModal.remove();
  });
  okButton.style.marginRight = "4px";
  const cancelButton = document.createElement("button");
  cancelButton.classList.add("danger");
  cancelButton.innerText = "Cancelar";
  cancelButton.addEventListener("click", () => {
    onCancel();
    newModal.remove();
  });

  modalContent.appendChild(questionText);
  modalContent.appendChild(okButton);
  modalContent.appendChild(cancelButton);

  newModal.appendChild(modalContent);

  document.body.appendChild(newModal);
}

function renderMessage(message, type) {
  const messages = document.getElementById("messages");

  const messageContainer = document.createElement("div");
  messageContainer.classList.add("message");
  messageContainer.classList.add(type);
  messageContainer.innerText = message;

  messages.appendChild(messageContainer);

  setTimeout(() => {
    messageContainer.remove();
  }, 5000);
}

renderTasks();

let idOfEditingTask = undefined;
