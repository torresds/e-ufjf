document.addEventListener('DOMContentLoaded', () => {
    const departmentSelect = document.getElementById('departmentSelect');
    const fetchButton = document.getElementById('fetchButton');
    const clearHistoryButton = document.getElementById('clearHistoryButton');
    const historySearchInput = document.getElementById('historySearchInput');

    const loadingDiv = document.getElementById('loading');
    const feedbackDiv = document.getElementById('feedback');
    const noHistoryMessage = document.getElementById('no-history-message');

    const resultsDiv = document.getElementById('results');
    const resultsTableBody = document.querySelector('#resultsTable tbody');

    const historyTableBody = document.querySelector('#historyTable tbody');
    
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    const DEPARTMENTS = [
        { name: "Ciência da Computação", url: "https://www2.ufjf.br/deptocomputacao/institucional/corpo-docente/docentes/" },
        { name: "Estatística", url: "https://www2.ufjf.br/estatistica/cursos/docentes/" },
        { name: "Física", url: "https://www2.ufjf.br/fisica/institucional/docentes/" },
        { name: "Matemática", url: "https://www2.ufjf.br/mat/institucional/corpo-docente/docentes/" },
        { name: "Química", url: "https://www2.ufjf.br/quimica/institucional/docentes/" }
    ];


    const EMAIL_HISTORY_KEY = 'emailUFJF_emailHistory';
    const DEPARTMENTS_FETCHED_KEY = 'emailUFJF_departmentsFetched';

    const getStoredData = (key, isArray = false) => JSON.parse(localStorage.getItem(key)) || (isArray ? [] : {});
    const setStoredData = (key, data) => localStorage.setItem(key, JSON.stringify(data));
    
    const showFeedback = (message, type = 'error') => {
        feedbackDiv.textContent = message;
        feedbackDiv.className = type;
        feedbackDiv.classList.remove('hidden');
    };

    const copyToClipboard = (text, cellElement) => {
        navigator.clipboard.writeText(text).then(() => {
            const oldFeedback = cellElement.querySelector('.copy-feedback');
            if (oldFeedback) oldFeedback.remove();
            
            const feedback = document.createElement('span');
            feedback.className = 'copy-feedback';
            feedback.innerHTML = `<span class="material-icons">check_circle</span> Copiado!`;
            cellElement.appendChild(feedback);

            window.getComputedStyle(feedback).opacity;
            feedback.classList.add('show');

            setTimeout(() => {
                feedback.classList.remove('show');
                setTimeout(() => feedback.remove(), 500);
            }, 1500);
        });
    };
    

    const populateDepartmentSelect = () => {
        DEPARTMENTS.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.url;
            option.textContent = dept.name;
            departmentSelect.appendChild(option);
        });
    };

    const renderEmailHistory = () => {
        const history = getStoredData(EMAIL_HISTORY_KEY);
        historyTableBody.innerHTML = '';
        if (Object.keys(history).length === 0) {
            noHistoryMessage.classList.remove('hidden');
            historyTableBody.classList.add('hidden');
            return;
        }
        noHistoryMessage.classList.add('hidden');
        historyTableBody.classList.remove('hidden');
        const sortedEmails = Object.entries(history).sort(([, a], [, b]) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
        
        sortedEmails.forEach(([email, data]) => {
            const tr = document.createElement('tr');
            const formattedDate = new Date(data.lastAccessed).toLocaleDateString('pt-BR');
            tr.innerHTML = `
                <td>${data.name}</td>
                <td class="email-cell" title="Clique para copiar">${email}</td>
                <td>${data.departmentName}</td>
                <td>${formattedDate}</td>
                <td class="actions-cell">
                    <a href="mailto:${email}" class="action-button" title="Enviar e-mail para ${email}">
                        <span class="material-icons">send</span>
                    </a>
                </td>
            `;
            historyTableBody.appendChild(tr);
        });
    };
    

    const handleFetch = async () => {
        const targetUrl = departmentSelect.value;
        const selectedDepartment = DEPARTMENTS.find(dept => dept.url === targetUrl);
        
        if (!selectedDepartment) {
            showFeedback("Departamento inválido selecionado.");
            return;
        }

        const fetchedDepts = getStoredData(DEPARTMENTS_FETCHED_KEY, true);
        if (fetchedDepts.includes(targetUrl)) {
            const userConfirmation = confirm(`O departamento "${selectedDepartment.name}" já consta no seu histórico. Deseja fazer uma nova busca para atualizar os dados?`);
            if (!userConfirmation) return;
        }

        feedbackDiv.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        resultsDiv.classList.add('hidden');

        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`O proxy não conseguiu acessar a URL. Status: ${response.status}`);

            const data = await response.json();
            const htmlText = data.contents;
            if (!htmlText) throw new Error("O proxy retornou uma resposta vazia.");

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            const professorRows = doc.querySelectorAll('tr.docentes');
if (professorRows.length === 0) throw new Error("Nenhum docente encontrado. Verifique a URL ou a estrutura da página.");

            resultsTableBody.innerHTML = '';
            const emailHistory = getStoredData(EMAIL_HISTORY_KEY);
            let currentFetchedDepts = getStoredData(DEPARTMENTS_FETCHED_KEY, true);
            const timestamp = new Date().toISOString();
            let newEmailsFound = 0;

            professorRows.forEach(row => {
                const nameCell = row.querySelector('td:first-child');
                const emailButton = row.querySelector('button[data-email]');
                if (nameCell && emailButton) {
                    newEmailsFound++;
                    const name = nameCell.textContent.trim();
                    const email = atob(emailButton.getAttribute('data-email'));
                    resultsTableBody.innerHTML += `<tr><td>${name}</td><td class="email-cell" title="Clique para copiar">${email}</td></tr>`;
                    emailHistory[email] = { name, departmentName: selectedDepartment.name, lastAccessed: timestamp };
                }
            });

            if (newEmailsFound > 0) {
                showFeedback(`${newEmailsFound} contatos foram extraídos e salvos no histórico.`, 'success');
                if (!currentFetchedDepts.includes(targetUrl)) {
                    currentFetchedDepts.push(targetUrl);
                }
                setStoredData(EMAIL_HISTORY_KEY, emailHistory);
                setStoredData(DEPARTMENTS_FETCHED_KEY, currentFetchedDepts);
                renderEmailHistory();
                resultsDiv.classList.remove('hidden');
            } else {
                throw new Error("Nenhum e-mail foi extraído.");
            }
        } catch (err) {
            showFeedback(`Falha na Extração: ${err.message}`);
        } finally {
            loadingDiv.classList.add('hidden');
        }
    };


    fetchButton.addEventListener('click', handleFetch);

    tabLinks.forEach(tab => {
        tab.addEventListener('click', () => {
            tabLinks.forEach(link => link.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    historySearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        historyTableBody.querySelectorAll('tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
        });
    });

    [historyTableBody, resultsTableBody].forEach(table => {
        table.addEventListener('click', (e) => {
            const emailCell = e.target.closest('.email-cell');
            if (emailCell) {
                copyToClipboard(emailCell.textContent, emailCell);
            }
        });
    });

    clearHistoryButton.addEventListener('click', () => {
        if (confirm('Tem certeza de que deseja apagar permanentemente todo o histórico?')) {
            localStorage.removeItem(EMAIL_HISTORY_KEY);
            localStorage.removeItem(DEPARTMENTS_FETCHED_KEY);
            renderEmailHistory();
            resultsDiv.classList.add('hidden');
            showFeedback('Histórico limpo com sucesso.', 'success');
        }
    });


    const initialize = () => {
        populateDepartmentSelect();
        renderEmailHistory();
    };

    initialize();
});
