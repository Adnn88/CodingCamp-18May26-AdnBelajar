document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // MODULE 1: CLOCK & GREETING (Tantangan: Custom Name)
    // ==========================================================================
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    const greetingTextEl = document.getElementById('greeting-text');
    const usernameEl = document.getElementById('username');

    if (localStorage.getItem('dashboard-name')) {
        usernameEl.textContent = localStorage.getItem('dashboard-name');
    }

    usernameEl.addEventListener('blur', () => {
        localStorage.setItem('dashboard-name', usernameEl.textContent.trim() || 'Guest');
    });

    function updateClockAndGreeting() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
        dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const hours = now.getHours();
        let greeting = 'Good Evening';
        if (hours < 12) greeting = 'Good Morning';
        else if (hours < 18) greeting = 'Good Afternoon';
        
        greetingTextEl.firstChild.textContent = `${greeting}, `;
    }
    setInterval(updateClockAndGreeting, 1000);
    updateClockAndGreeting();


    // ==========================================================================
    // MODULE 2: FOCUS TIMER (Tantangan: Change Pomodoro Time)
    // ==========================================================================
    let timerInterval = null;
    const timerDisplay = document.getElementById('timer-display');
    const timerDurationInput = document.getElementById('timer-duration');
    const btnStart = document.getElementById('timer-start');
    const btnStop = document.getElementById('timer-stop');
    const btnReset = document.getElementById('timer-reset');

    // Load preferensi menit dari Local Storage jika ada, jika tidak, set default ke 25
    let currentSettingsMins = parseInt(localStorage.getItem('timer-custom-duration')) || 25;
    timerDurationInput.value = currentSettingsMins;
    let timeRemaining = currentSettingsMins * 60;

    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const seconds = (timeRemaining % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    // Event listener jika user mengganti angka durasi menit kerja
    timerDurationInput.addEventListener('change', () => {
        if (timerInterval !== null) return; // Kunci input jika timer sedang aktif berjalan
        let val = parseInt(timerDurationInput.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 60) val = 60;
        
        timerDurationInput.value = val;
        currentSettingsMins = val;
        timeRemaining = val * 60;
        localStorage.setItem('timer-custom-duration', val);
        updateTimerDisplay();
    });

    btnStart.addEventListener('click', () => {
        if (timerInterval !== null) return;
        timerInterval = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                alert("Focus time is up! Take a break.");
            }
        }, 1000);
    });

    btnStop.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
    });

    btnReset.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        timeRemaining = currentSettingsMins * 60;
        updateTimerDisplay();
    });

    updateTimerDisplay();


    // ==========================================================================
    // MODULE 3: TO-DO LIST (Tantangan: Prevent Duplicate & Sort Tasks)
    // ==========================================================================
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const todoSortSelect = document.getElementById('todo-sort');
    
    let todos = JSON.parse(localStorage.getItem('dashboard-todos')) || [];
    let currentSortMethod = localStorage.getItem('dashboard-todo-sort') || 'default';
    todoSortSelect.value = currentSortMethod;

    function saveTodos() {
        localStorage.setItem('dashboard-todos', JSON.stringify(todos));
    }

    function renderTodos() {
        todoList.innerHTML = '';
        
        // Membuat salinan array terpisah untuk disortir agar data asli di Local Storage tidak rusak
        let displayTodos = [...todos];

        if (currentSortMethod === 'alpha') {
            displayTodos.sort((a, b) => a.text.localeCompare(b.text));
        } else if (currentSortMethod === 'status') {
            displayTodos.sort((a, b) => a.done - b.done); // false (belum beres) akan naik ke atas
        }

        displayTodos.forEach((todo) => {
            const li = document.createElement('li');
            if (todo.done) li.classList.add('done');

            // Menggunakan data-id sebagai referensi aksi CRUD, bukan index array lagi
            li.innerHTML = `
                <div>
                    <input type="checkbox" ${todo.done ? 'checked' : ''} data-id="${todo.id}">
                    <span>${todo.text}</span>
                </div>
                <button class="btn btn-delete" data-id="${todo.id}">Delete</button>
            `;
            todoList.appendChild(li);
        });
    }

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = todoInput.value.trim();
        
        // [Tantangan: Prevent Duplicate Tasks]
        const isDuplicate = todos.some(todo => todo.text.toLowerCase() === taskText.toLowerCase());
        if (isDuplicate) {
            alert('This task already exists!');
            return;
        }

        // Menyimpan data dengan ID berbasis waktu unix (Unique ID)
        todos.push({ id: Date.now(), text: taskText, done: false });
        saveTodos();
        renderTodos();
        todoInput.value = '';
    });

    // Event handler delegasi menggunakan attribute data-id
    todoList.addEventListener('click', (e) => {
        const targetId = parseInt(e.target.dataset.id);
        if (isNaN(targetId)) return;

        if (e.target.type === 'checkbox') {
            const targetTodo = todos.find(t => t.id === targetId);
            if (targetTodo) targetTodo.done = e.target.checked;
        } else if (e.target.classList.contains('btn-delete')) {
            todos = todos.filter(t => t.id !== targetId);
        }
        saveTodos();
        renderTodos();
    });

    // [Tantangan: Sort Tasks Listener]
    todoSortSelect.addEventListener('change', () => {
        currentSortMethod = todoSortSelect.value;
        localStorage.setItem('dashboard-todo-sort', currentSortMethod);
        renderTodos();
    });

    renderTodos();


    // ==========================================================================
    // MODULE 4: QUICK LINKS
    // ==========================================================================
    const linkForm = document.getElementById('link-form');
    const linkNameInput = document.getElementById('link-name');
    const linkUrlInput = document.getElementById('link-url');
    const linksContainer = document.getElementById('links-container');
    let links = JSON.parse(localStorage.getItem('dashboard-links')) || [
        { name: 'Google', url: 'https://google.com' },
        { name: 'Gmail', url: 'https://gmail.com' }
    ];

    function saveLinks() {
        localStorage.setItem('dashboard-links', JSON.stringify(links));
    }

    function renderLinks() {
        linksContainer.innerHTML = '';
        links.forEach((link, index) => {
            const item = document.createElement('div');
            item.className = 'link-item';

            const anchor = document.createElement('a');
            anchor.href = link.url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.textContent = link.name;

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'btn btn-remove-link';
            removeButton.dataset.index = index;
            removeButton.textContent = '×';

            item.appendChild(anchor);
            item.appendChild(removeButton);
            linksContainer.appendChild(item);
        });
    }

    linkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = linkNameInput.value.trim();
        const url = linkUrlInput.value.trim();

        if (!name || !url) {
            alert('Please enter a link name and URL.');
            return;
        }

        const duplicateLink = links.some((link) => link.url === url || link.name.toLowerCase() === name.toLowerCase());
        if (duplicateLink) {
            alert('This link already exists.');
            return;
        }

        links.push({ name, url });
        saveLinks();
        renderLinks();
        linkForm.reset();
        linkNameInput.focus();
    });

    linksContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-link')) {
            const index = parseInt(e.target.dataset.index, 10);
            if (!Number.isNaN(index)) {
                links.splice(index, 1);
                saveLinks();
                renderLinks();
            }
        }
    });

    renderLinks();


    // ==========================================================================
    // MODULE 5: LIGHT/DARK THEME TOGGLE (Tantangan: Theme Mode)
    // ==========================================================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('dashboard-theme') || 'light';

    function updateThemeButton(theme) {
        themeToggleBtn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
        localStorage.setItem('dashboard-theme', theme);
        updateThemeButton(theme);
    }

    applyTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const nextTheme = document.body.hasAttribute('data-theme') ? 'light' : 'dark';
        applyTheme(nextTheme);
    });

    usernameEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            usernameEl.blur();
        }
    });

});