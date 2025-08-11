<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { fetchProfessors } from '../services/emailExtractor';
import { useClipboard } from '../composables/useClipboard';
import { type Department, type Professor, type HistoryEntry } from '../types';
import BaseSpinner from './BaseSpinner.vue';
import BaseModal from './BaseModal.vue';

const emit = defineEmits(['emails-extracted']);

const EMAIL_HISTORY_KEY = 'emailUFJF_emailHistory';
const DEPARTMENTS: Department[] = [
    { name: "Ciência da Computação", url: "https://www2.ufjf.br/deptocomputacao/institucional/corpo-docente/docentes/" },
    { name: "Estatística", url: "https://www2.ufjf.br/estatistica/cursos/docentes/" },
    { name: "Física", url: "https://www2.ufjf.br/fisica/institucional/docentes/" },
    { name: "Matemática", url: "https://www2.ufjf.br/mat/institucional/corpo-docente/docentes/" },
    { name: "Química", url: "https://www2.ufjf.br/quimica/institucional/docentes/" }
];

const selectedDepartmentUrl = ref(DEPARTMENTS[0].url);
const isLoading = ref(false);
const results = ref<Professor[]>([]);
const showModal = ref(false);
const toast = useToast();
const { copy } = useClipboard();

const handleFetch = async (force = false) => {
  if (!selectedDepartmentUrl.value) {
    toast.warning('Por favor, selecione um departamento.');
    return;
  }

  const existingHistory: HistoryEntry[] = JSON.parse(localStorage.getItem(EMAIL_HISTORY_KEY) || '[]');
  const departmentAlreadyFetched = existingHistory.some(entry => entry.departmentName === getDepartmentName(selectedDepartmentUrl.value));

  if (departmentAlreadyFetched && !force) {
    showModal.value = true;
    return;
  }
  
  showModal.value = false;
  isLoading.value = true;
  results.value = [];

  try {
    const selectedDepartment = DEPARTMENTS.find(d => d.url === selectedDepartmentUrl.value)!;
    const fetchedProfessors = await fetchProfessors(selectedDepartment);
    
    if (fetchedProfessors.length > 0) {
      results.value = fetchedProfessors;
      saveToHistory(fetchedProfessors, selectedDepartment.name);
      toast.success(`${fetchedProfessors.length} contatos foram extraídos e salvos no histórico.`);
    } else {
      toast.warning('Nenhum e-mail foi encontrado para este departamento.');
    }
  } catch (error: any) {
    toast.error(`Falha na extração: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
};

const saveToHistory = (professors: Professor[], departmentName: string) => {
  const timestamp = new Date().toISOString();
  const newEntries: HistoryEntry[] = professors.map(p => ({
    ...p,
    departmentName,
    fetchedAt: timestamp,
  }));

  let history: HistoryEntry[] = JSON.parse(localStorage.getItem(EMAIL_HISTORY_KEY) || '[]');
  
  history = history.filter(entry => entry.departmentName !== departmentName);
  
  const updatedHistory = [...history, ...newEntries];
  
  localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(updatedHistory));
  emit('emails-extracted', updatedHistory);
};

const getDepartmentName = (url: string) => {
    return DEPARTMENTS.find(d => d.url === url)?.name || 'Desconhecido';
}

const copyAllEmails = () => {
  if (results.value.length === 0) return;
  const allEmails = results.value.map(p => p.email).join(', ');
  copy(allEmails, `${results.value.length} e-mails copiados!`);
};
</script>

<template>
  <div class="fade-in-slide-up">
    <div class="card">
      <div class="input-area">
        <div class="select-wrapper">
          <span class="material-icons">school</span>
          <select id="departmentSelect" v-model="selectedDepartmentUrl" :disabled="isLoading">
            <option v-for="dept in DEPARTMENTS" :key="dept.url" :value="dept.url">
              {{ dept.name }}
            </option>
          </select>
        </div>
        <button id="fetchButton" class="action-button" @click="() => handleFetch()" :disabled="isLoading">
          <BaseSpinner v-if="isLoading" style="width: 20px; height: 20px; border-width: 2px; margin: 0;" />
          <span v-else class="material-icons">travel_explore</span>
          {{ isLoading ? 'Extraindo...' : 'Extrair' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-feedback">
      <BaseSpinner />
      <p>Buscando e processando os dados...</p>
      <p class="subtle">Isso pode levar alguns segundos.</p>
    </div>

    <div v-if="results.length > 0 && !isLoading" class="card fade-in-slide-up">
      <div class="results-header">
        <h2>Resultados da Extração</h2>
        <button class="copy-all-btn" @click="copyAllEmails">
          <span class="material-icons">content_copy</span>
          Copiar Todos
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Docente</th>
            <th>E-mail</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prof in results" :key="prof.email">
            <td>{{ prof.name }}</td>
            <td class="email-cell" title="Clique para copiar" @click="copy(prof.email, `E-mail de ${prof.name} copiado!`)">
              {{ prof.email }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Confirmação -->
    <BaseModal 
      :show="showModal"
      title="Departamento já verificado"
      message="Este departamento já consta no seu histórico. Fazer uma nova busca irá substituir os dados existentes. Deseja continuar?"
      confirm-text="Sim, buscar novamente"
      @close="showModal = false"
      @confirm="() => handleFetch(true)"
    />
  </div>
</template>

<style scoped>
.input-area {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.select-wrapper {
  flex-grow: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.select-wrapper .material-icons {
  position: absolute;
  left: 1rem;
  color: var(--text-light);
  pointer-events: none;
}

#departmentSelect {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  font-size: 1rem;
  font-family: var(--font-family);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  appearance: none;
  background-color: white;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236c757d%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right .7em top 50%;
  background-size: .65em auto;
  cursor: pointer;
}

.loading-feedback {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-light);
}
.loading-feedback .subtle {
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: -0.5rem;
}
.results-header h2 {
    color: var(--ufjf-blue);
}

.copy-all-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-dark);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.copy-all-btn:hover {
    background-color: var(--ufjf-blue-light);
    border-color: var(--ufjf-blue);
}

td.email-cell {
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  font-weight: 600;
  color: var(--ufjf-blue);
}
td.email-cell:hover {
  background-color: var(--ufjf-blue-light);
}
</style>
