class TodoList {
    constructor(listSelector, searchSelector, sortSelector, formSelector, inputSelector, dateSelector, errorSelector) {
        this.listElement = document.querySelector(listSelector);
        this.searchInput = document.querySelector(searchSelector);
        this.sortSelect = document.querySelector(sortSelector);
        this.addForm = document.querySelector(formSelector);
        this.taskInput = document.querySelector(inputSelector);
        this.dateInput = document.querySelector(dateSelector);
        this.errorElement = document.querySelector(errorSelector);

        this.tasks = [];
        this.searchTerm = '';
        this.sortMethod = 'date-desc'; 
    }

    init() {
        this.loadFromLocalStorage();
        this.addEventListeners();
        this.render();
    }

    addEventListeners() {
        this.addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        });

        this.sortSelect.addEventListener('change', (e) => {
            this.sortMethod = e.target.value;
            this.render();
        });

        this.listElement.addEventListener('click', (e) => {
            const target = e.target;
            const li = target.closest('li');
            if (!li) return;

            const taskId = parseInt(li.dataset.id);

            if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
                this.deleteTask(taskId);
            } 
            else if (li.querySelector('.task-content')) {
                this.enterEditMode(li, taskId);
            }
        });
    }

    addTask() {
        const text = this.taskInput.value.trim();
        const date = this.dateInput.value;

        const validationError = this.validateTask(text, date);
        if (validationError) {
            this.showError(validationError);
            return;
        }

        this.clearError();
        const newTask = {
            id: Date.now(),
            text: text,
            date: date
        };

        this.tasks.push(newTask);
        this.saveToLocalStorage();
        this.render();

        this.taskInput.value = '';
        this.dateInput.value = '';
    }

    validateTask(text, date) {
        if (text.length < 3) return "Zadanie musi mieć co najmniej 3 znaki.";
        if (text.length > 255) return "Zadanie nie może mieć więcej niż 255 znaków.";
        
        return null;
    }

    showError(message) {
        this.errorElement.textContent = message;
    }

    clearError() {
        this.errorElement.textContent = '';
    }
    
    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToLocalStorage();
        this.render();
    }

    updateTask(id, newText, newDate) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.text = newText;
            task.date = newDate;
        }
        this.saveToLocalStorage();
        this.render();
    }

    enterEditMode(liElement, taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const dateForInput = task.date ? new Date(task.date).toISOString().slice(0, 16) : '';

        liElement.innerHTML = `
            <input type="text" class="edit-input" value="${task.text}">
            <input type="datetime-local" class="edit-date-input" value="${dateForInput}">
        `;

        const editInput = liElement.querySelector('.edit-input');
        const editDateInput = liElement.querySelector('.edit-date-input');
        
        editInput.focus();

        const saveChanges = () => {
             const newText = editInput.value.trim();
             const newDate = editDateInput.value;
             const validationError = this.validateTask(newText, newDate);

             if(validationError) {
                alert(validationError);
                this.render(); 
             } else {
                this.updateTask(taskId, newText, newDate);
             }
        };

        const handleBlur = (e) => {
            
            if (!liElement.contains(e.relatedTarget)) {
                saveChanges();
            }
        };

        editInput.addEventListener('blur', handleBlur);
        editDateInput.addEventListener('blur', handleBlur);

        liElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveChanges();
            } else if (e.key === 'Escape') {
                this.render();
            }
        });
    }

    getFilteredTasks() {
        if (this.searchTerm.length < 2) {
            return this.tasks;
        }
        return this.tasks.filter(task =>
            task.text.toLowerCase().includes(this.searchTerm)
        );
    }
    
    getSortedTasks(tasks) {
        const sortedTasks = [...tasks]; 

        sortedTasks.sort((a, b) => {
            switch (this.sortMethod) {
                case 'text-asc':
                   
                    return a.text.localeCompare(b.text, 'pl', { sensitivity: 'base' });

                case 'date-asc': 
                    const aHasDateAsc = a.date ? 1 : 0;
                    const bHasDateAsc = b.date ? 1 : 0;

                    if (aHasDateAsc !== bHasDateAsc) {
                        return bHasDateAsc - aHasDateAsc; 
                    }

                    if (!a.date && !b.date) return 0; 
                    return new Date(b.date).getTime() - new Date(a.date).getTime();

                case 'date-desc': 
                default:
                    const aHasDateDesc = a.date ? 1 : 0;
                    const bHasDateDesc = b.date ? 1 : 0;
                    
                    if (aHasDateDesc !== bHasDateDesc) {
                        return bHasDateDesc - aHasDateDesc; 
                    }

                    if (!a.date && !b.date) return 0; 
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
            }
        });
        return sortedTasks;
    }
    
    render() {
        this.listElement.innerHTML = '';
        
        const filteredTasks = this.getFilteredTasks();
        const sortedAndFilteredTasks = this.getSortedTasks(filteredTasks);

        if (sortedAndFilteredTasks.length === 0) {
            this.listElement.innerHTML = '<li>Brak zadań do wyświetlenia.</li>';
            return;
        }
        
        sortedAndFilteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.dataset.id = task.id;

            const formattedDate = task.date 
                ? new Date(task.date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                : '';

            let taskTextHTML = task.text;
            if (this.searchTerm.length >= 2) {
                const regex = new RegExp(`(${this.searchTerm})`, 'gi');
                taskTextHTML = task.text.replace(regex, '<span class="highlight">$1</span>');
            }
            
            li.innerHTML = `
                <span class="task-content">${taskTextHTML}</span>
                <span class="task-date">${formattedDate}</span>
                <button class="delete-btn" aria-label="Usuń zadanie">🗑️</button>
            `;
            this.listElement.appendChild(li);
        });
    }

    saveToLocalStorage() {
        localStorage.setItem('todo-tasks', JSON.stringify(this.tasks));
    }

    loadFromLocalStorage() {
        const storedTasks = localStorage.getItem('todo-tasks');
        if (storedTasks) {
            try {
                this.tasks = JSON.parse(storedTasks);
            } catch (e) {
                console.error("Błąd podczas parsowania danych z LocalStorage:", e);
                this.tasks = [];
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const todoApp = new TodoList(
        '#todo-list',
        '#search-input',
        '#sort-select',
        '#add-form',
        '#new-task-input',
        '#new-task-date',
        '#validation-error'
    );
    todoApp.init();
});