import { type Professor, type Department } from '../types';

const buildProxyChain = (target: string) => [
  `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
  `https://cors.isomorphic-git.org/${target}`,
  `https://r.jina.ai/${target}`,
];

async function fetchHtmlWithFallback(urls: string[]): Promise<string> {
  let lastErr: any = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      if (text && text.length) return text;
      lastErr = new Error('Resposta vazia');
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('Falha ao buscar HTML');
}

function extractFromDom(html: string): Professor[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const out: Professor[] = [];

  //Preferido: qualquer nó com data-email (botões, links, etc.)
  const emailNodes = doc.querySelectorAll<HTMLElement>('[data-email]');
  emailNodes.forEach((el) => {
    const encoded = el.getAttribute('data-email') || '';
    const email = encoded ? atob(encoded) : '';
    if (!email) return;

    // Tenta subir até a linha (tr) e pegar o primeiro td como nome
    let name = 'Nome não encontrado';
    const tr = el.closest('tr');
    if (tr) {
      const firstTd = tr.querySelector('td');
      const candidate = firstTd?.textContent?.trim();
      if (candidate) name = candidate.replace(/\s+/g, ' ');
    } else {
      const siblingText = el.parentElement?.textContent?.trim();
      if (siblingText) name = siblingText.replace(/\s+/g, ' ');
    }

    out.push({ name, email });
  });

  //Se a página realmente usa <tr class="docentes">, mantém compat.
  if (out.length === 0) {
    const rows = doc.querySelectorAll('tr.docentes');
    rows.forEach((row) => {
      const nameCell = row.querySelector('td:first-child');
      const emailBtn = row.querySelector<HTMLElement>('[data-email]');
      if (!emailBtn) return;
      const encoded = emailBtn.getAttribute('data-email') || '';
      const email = encoded ? atob(encoded) : '';
      if (!email) return;
      const name = (nameCell?.textContent || 'Nome não encontrado').trim().replace(/\s+/g, ' ');
      out.push({ name, email });
    });
  }

  return out;
}

function extractByRegex(html: string): Professor[] {
  const out: Professor[] = [];
  // Captura data-email="BASE64"
  const re = /data-email=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const encoded = m[1];
    let email = '';
    try { email = atob(encoded); } catch {}
    if (!email) continue;

    // pega ~80 chars antes do match e limpa tags
    const contextStart = Math.max(0, m.index - 200);
    const context = html.slice(contextStart, m.index);
    const name = context
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/[:|·•\-–—]/).slice(-1)[0] || 'Nome não encontrado';

    out.push({ name, email });
  }
  return out;
}

export async function fetchProfessors(department: Department): Promise<Professor[]> {
  const proxies = buildProxyChain(department.url);
  const html = await fetchHtmlWithFallback(proxies);

  // Tenta DOM primeiro (para proxies que preservam HTML)
  let professors = extractFromDom(html);

  // Se não achou nada e caiu no r.jina.ai (HTML “achado”), tenta regex
  if (professors.length === 0 && html.startsWith('https://') === false) {
    const viaRegex = extractByRegex(html);
    if (viaRegex.length > 0) professors = viaRegex;
  }

  if (professors.length === 0) {
    throw new Error('Nenhum docente encontrado. Verifique a URL ou a estrutura da página.');
  }

  return professors;
}
