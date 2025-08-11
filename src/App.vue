<script setup lang="ts">
import { ref, computed } from 'vue';
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import SearchTab from './components/SearchTab.vue';
import HistoryTab from './components/HistoryTab.vue';
import { type HistoryEntry } from './types';

const activeTab = ref<'search' | 'history'>('search');

const emailHistory = ref<HistoryEntry[]>([]);

const onEmailsExtracted = (newHistory: HistoryEntry[]) => {
  emailHistory.value = newHistory;
  activeTab.value = 'history';
};


const onHistoryUpdated = (updatedHistory: HistoryEntry[]) => {
  emailHistory.value = updatedHistory;
};


const searchTabClass = computed(() => ({
  'tab-link': true,
  'active': activeTab.value === 'search',
}));

const historyTabClass = computed(() => ({
  'tab-link': true,
  'active': activeTab.value === 'history',
}));
</script>

<template>
  <div class="container">
    <Header />

    <nav class="tabs">
      <button :class="searchTabClass" @click="activeTab = 'search'">
        <span class="material-icons">search</span> Nova busca
      </button>
      <button :class="historyTabClass" @click="activeTab = 'history'">
        <span class="material-icons">history</span> Histórico
      </button>
    </nav>

    <main>
      <SearchTab 
        v-show="activeTab === 'search'" 
        @emails-extracted="onEmailsExtracted" 
      />
      <HistoryTab 
        v-if="activeTab === 'history'" 
        :initial-history="emailHistory"
        @history-updated="onHistoryUpdated"
      />
    </main>

    <Footer />
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 2rem;
}

.tab-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: none;
  color: var(--text-light);
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease-in-out;
  position: relative;
  top: 2px; /* Alinha com a borda inferior */
}

.tab-link:hover {
  color: var(--ufjf-blue);
}

.tab-link.active {
  color: var(--ufjf-blue);
  border-bottom-color: var(--ufjf-blue);
}
</style>
