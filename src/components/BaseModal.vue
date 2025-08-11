<script setup lang="ts">
interface Props {
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
});

const emit = defineEmits(['confirm', 'close']);
</script>

<template>
  <!-- Teleporta o modal para o final do body para evitar problemas de z-index -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="props.show" class="modal-backdrop" @click="emit('close')">
        <div class="modal-content" @click.stop>
          <h3 class="modal-title">{{ props.title }}</h3>
          <p class="modal-message">{{ props.message }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="emit('close')">
              {{ props.cancelText }}
            </button>
            <button class="btn-confirm" @click="emit('confirm')">
              {{ props.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 450px;
  text-align: center;
}

.modal-title {
  margin-top: 0;
  color: var(--text-dark);
  font-weight: 700;
}

.modal-message {
  color: var(--text-light);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.modal-actions button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #f0f0f0;
  color: var(--text-dark);
  border: 1px solid var(--border-color);
}
.btn-cancel:hover {
  background-color: #e2e6ea;
}

.btn-confirm {
  background-color: var(--danger-color);
  color: white;
}
.btn-confirm:hover {
  opacity: 0.85;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
