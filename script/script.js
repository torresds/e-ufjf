document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const fetchButton = document.getElementById('fetchButton');
    const clearHistoryButton = document.getElementById('clearHistoryButton');
    const historySearchInput = document.getElementById('historySearchInput');

    const loadingDiv = document.getElementById('loading');
    const feedbackDiv = document.getElementById('feedback');
    const noHistoryMessage = document.getElementById('no-history-message');

    const resultsDiv = document.getElementById('results');
    const resultsTableBody = document.querySelector('#resultsTable tbody');

    const visitedUrlsContainer = document.getElementById('visited-urls-container');
    const visitedUrlsList = document.getElementById('visitedUrlsList');

    const historyTableBody = document.querySelector('#historyTable tbody');
    
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    const EMAIL_HISTORY_KEY = 'emailUFJF_emailHistory';
    const VISITED_URLS_KEY = 'emailUFJF_visitedUrls';

    const getStoredData = (key) => JSON.parse(localStorage.getItem(key)) || (key === VISITED_URLS_KEY ? [] : {});
    const setStoredData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    const getDepartmentNameFromUrl = (url) => {
        try {
            const pathSegments = new URL(url).pathname.split('/').filter(Boolean);
            return pathSegments[0] || new URL(url).hostname;
        } catch (e) {
            return url;
        }
    };

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
            const departmentName = getDepartmentNameFromUrl(data.urlSource);

            tr.innerHTML = `
                <td>${data.name}</td>
                <td class="email-cell" title="Clique para copiar">${email}</td>
                <td>${departmentName}</td>
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

    const renderVisitedUrls = () => {
        const urls = getStoredData(VISITED_URLS_KEY);
        visitedUrlsList.innerHTML = '';
        if (urls.length === 0) {
            visitedUrlsContainer.classList.add('hidden');
            return;
        }
        visitedUrlsContainer.classList.remove('hidden');
        urls.slice(-5).reverse().forEach(url => {
            const departmentName = getDepartmentNameFromUrl(url);
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = departmentName;
            a.title = `Buscar novamente em: ${url}`;
            a.dataset.url = url;
            visitedUrlsList.appendChild(a);
        });
    };
    
    const handleFetch = async (isTriggeredByUser = true) => {
        let targetUrl = urlInput.value.trim();
        if (!targetUrl) {
            showFeedback("Por favor, insira uma URL válida.");
            return;
        }
        if (!targetUrl.endsWith('/')) targetUrl += '/';
        urlInput.value = targetUrl;
        
        const visitedUrls = getStoredData(VISITED_URLS_KEY);
        if (isTriggeredByUser && visitedUrls.includes(targetUrl)) {
            const userConfirmation = confirm("Este departamento já consta no seu histórico. Deseja fazer uma nova busca para atualizar os dados?");
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
            let currentVisitedUrls = getStoredData(VISITED_URLS_KEY);
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
                    emailHistory[email] = { name, urlSource: targetUrl, lastAccessed: timestamp };
                }
            });

            if (newEmailsFound > 0) {
                showFeedback(`${newEmailsFound} contatos foram extraídos e salvos no histórico.`, 'success');
                currentVisitedUrls = currentVisitedUrls.filter(url => url !== targetUrl);
                currentVisitedUrls.push(targetUrl);
                setStoredData(EMAIL_HISTORY_KEY, emailHistory);
                setStoredData(VISITED_URLS_KEY, currentVisitedUrls);
                renderEmailHistory();
                renderVisitedUrls();
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

    fetchButton.addEventListener('click', () => handleFetch(true));

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
            localStorage.removeItem(VISITED_URLS_KEY);
            renderEmailHistory();
            renderVisitedUrls();
            resultsDiv.classList.add('hidden');
            showFeedback('Histórico limpo com sucesso.', 'success');
        }
    });

    visitedUrlsList.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            urlInput.value = e.target.dataset.url;
            handleFetch(false);
        }
    });

    const initialize = () => {
        renderEmailHistory();
        renderVisitedUrls();
    };



    initialize();
});
