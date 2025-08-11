import { type Professor, type Department } from '../types';

// URL do proxy para contornar problemas de CORS
const PROXY_URL = 'https://api.allorigins.win/get?url=';

/**
 * Busca e extrai os dados dos docentes de uma URL de departamento.
 * @param department O objeto do departamento a ser buscado.
 * @returns Uma promessa que resolve para um array de Professores.
 */
export async function fetchProfessors(department: Department): Promise<Professor[]> {
  const targetUrl = `${PROXY_URL}${encodeURIComponent(department.url)}`;
  const professors: Professor[] = [];

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`O proxy não conseguiu acessar a URL. Status: ${response.status}`);
    }

    const data = await response.json();
    const htmlText = data.contents;
    if (!htmlText) {
      throw new Error('O proxy retornou uma resposta vazia.');
    }

    // Usa DOMParser para analisar o HTML retornado
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Seleciona todas as linhas com a classe 'docentes'
    const professorRows = doc.querySelectorAll('tr.docentes');
    if (professorRows.length === 0) {
      throw new Error('Nenhum docente encontrado. Verifique a URL ou a estrutura da página.');
    }

    professorRows.forEach(row => {
      const nameCell = row.querySelector('td:first-child');
      // O e-mail está codificado em base64 no atributo 'data-email' de um botão
      const emailButton = row.querySelector('button[data-email]');

      if (nameCell && emailButton) {
        const name = nameCell.textContent?.trim() ?? 'Nome não encontrado';
        // Decodifica o e-mail de base64
        const email = atob(emailButton.getAttribute('data-email') ?? '');
        
        if (email) {
            professors.push({ name, email });
        }
      }
    });

    return professors;

  } catch (error) {
    console.error('Falha na extração:', error);
    throw error;
  }
}
