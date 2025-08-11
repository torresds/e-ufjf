<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useClipboard } from '../composables/useClipboard';
import { type HistoryEntry } from '../types';
import BaseModal from './BaseModal.vue';

const props = defineProps<{
  initialHistory: HistoryEntry[];
}>();
const emit = defineEmits(['history-updated']);

const EMAIL_HISTORY_KEY = 'emailUFJF_emailHistory';

const history = ref<HistoryEntry[]>([]);
const filterTerm = ref('');
const showClearAllModal = ref(false);
const showDeleteOneModal = ref(false);
const itemToDelete = ref<HistoryEntry | null>(null);

const toast = useToast();
const { copy } = useClipboard();

// Carrega o histórico do localStorage ao montar o componente
onMounted(() => {
  const storedHistory = localStorage.getItem(EMAIL_HISTORY_KEY);
  history.value = storedHistory ? JSON.parse(storedHistory) : [];
  // Se o histórico inicial (prop) for mais recente, use-o
  if (props.initialHistory.length > 0 && props.initialHistory.length !== history.value.length) {
      history.value = props.initialHistory;
  }
});

watch(() => props.initialHistory, (newHistory) => {
  history.value = newHistory;
});

const filteredHistory = computed(() => {
  if (!filterTerm.value) {
    return [...history.value].sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime());
  }
  const term = filterTerm.value.toLowerCase();
  return history.value.filter(entry =>
    entry.name.toLowerCase().includes(term) ||
    entry.email.toLowerCase().includes(term) ||
    entry.departmentName.toLowerCase().includes(term)
  );
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const confirmClearAll = () => {
  history.value = [];
  localStorage.removeItem(EMAIL_HISTORY_KEY);
  emit('history-updated', []);
  showClearAllModal.value = false;
  toast.success('Histórico limpo com sucesso.');
};

const prepareToDeleteOne = (item: HistoryEntry) => {
  itemToDelete.value = item;
  showDeleteOneModal.value = true;
};

const confirmDeleteOne = () => {
  if (!itemToDelete.value) return;
  history.value = history.value.filter(entry => entry.email !== itemToDelete.value!.email);
  localStorage.setItem(EMAIL_HISTORY_KEY, JSON.stringify(history.value));
  emit('history-updated', history.value);
  toast.success(`'${itemToDelete.value.name}' removido do histórico.`);
  itemToDelete.value = null;
  showDeleteOneModal.value = false;
};
</script>

<template>
  <div class="card fade-in-slide-up">
    <div class="history-controls">
      <div class="search-history-wrapper">
        <span class="material-icons">filter_list</span>
        <input type="text" v-model="filterTerm" placeholder="Filtre por nome, e-mail ou departamento...">
      </div>
      <button 
        @click="showClearAllModal = true" 
        class="clear-button" 
        title="Limpar todo o histórico"
        v-if="history.length > 0"
      >
        <span class="material-icons">delete_sweep</span> Limpar tudo
      </button>
    </div>

    <!-- Tabela de Histórico -->
    <div v-if="filteredHistory.length > 0" id="email-history-container">
      <table>
        <thead>
          <tr>
            <th>Docente</th>
            <th>E-mail</th>
            <th>Departamento</th>
            <th>Verificado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in filteredHistory" :key="entry.email">
            <td>{{ entry.name }}</td>
            <td class="email-cell" title="Clique para copiar" @click="copy(entry.email, `E-mail de ${entry.name} copiado!`)">
              {{ entry.email }}
            </td>
            <td>{{ entry.departmentName }}</td>
            <td>{{ formatDate(entry.fetchedAt) }}</td>
            <td class="actions-cell">
              <a :href="`mailto:${entry.email}`" class="icon-button" :title="`Enviar e-mail para ${entry.name}`">
                <span class="material-icons">send</span>
              </a>
              <button @click="prepareToDeleteOne(entry)" class="icon-button delete" title="Remover do histórico">
                <span class="material-icons">delete_outline</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Estado Vazio -->
    <div v-else id="no-history-message" class="empty-state">
        <span class="material-icons large-icon">inbox</span>
        <h3>
            {{ history.length === 0 ? 'Seu histórico está vazio' : 'Nenhum resultado encontrado' }}
        </h3>
        <p>
            {{ history.length === 0 ? 'Faça uma nova busca para começar a salvar contatos.' : 'Tente um termo de busca diferente.' }}
        </p>
    </div>

    <BaseModal 
      :show="showClearAllModal"
      title="Limpar todo o histórico?"
      message="Esta ação é irreversível e apagará todos os contatos salvos. Tem certeza?"
      confirm-text="Sim, apagar tudo"
      @close="showClearAllModal = false"
      @confirm="confirmClearAll"
    />
     <BaseModal 
      :show="showDeleteOneModal"
      title="Remover este contato?"
      :message="`Tem certeza que deseja remover '${itemToDelete?.name}' do seu histórico?`"
      confirm-text="Sim, remover"
      @close="showDeleteOneModal = false"
      @confirm="confirmDeleteOne"
    />
  </div>
</template>

<style scoped>
.history-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-history-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
  max-width: 500px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0 0.75rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-history-wrapper:focus-within {
    border-color: var(--primary-action);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
}

.search-history-wrapper .material-icons {
  color: var(--text-light);
}

.search-history-wrapper input {
  width: 100%;
  padding: 0.75rem 0;
  border: none;
  outline: none;
  font-size: 1rem;
  background: none;
  font-family: var(--font-family);
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  color: var(--danger-color);
  background-color: transparent;
  border: 1px solid var(--danger-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-button:hover {
  background-color: var(--danger-color);
  color: white;
}

.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-light);
}
.empty-state .large-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    color: var(--border-color);
}
.empty-state h3 {
    color: var(--text-dark);
    margin: 0 0 0.5rem 0;
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

.actions-cell {
  text-align: center;
  white-space: nowrap;
}

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  padding: 6px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  text-decoration: none;
}
.icon-button:hover {
  background-color: var(--ufjf-blue-light);
  color: var(--ufjf-blue);
}
.icon-button.delete:hover {
    background-color: #fbebee;
    color: var(--danger-color);
}
.icon-button .material-icons {
  font-size: 1.25rem;
}
</style>
