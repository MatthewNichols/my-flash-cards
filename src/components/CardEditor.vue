<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Card } from '@/types';

/**
 * Component props
 */
const props = defineProps<{
  card?: Card;
  deckId: number;
}>();

/**
 * Component emits
 */
const emit = defineEmits<{
  save: [card: { frontText: string; backText: string }];
  cancel: [];
}>();

const frontText = ref<string>(props.card?.frontText || '');
const backText = ref<string>(props.card?.backText || '');
const error = ref<string>('');

/**
 * Watch for card prop changes (when editing different cards)
 */
watch(() => props.card, (newCard) => {
  frontText.value = newCard?.frontText || '';
  backText.value = newCard?.backText || '';
  error.value = '';
});

/**
 * Validate and save the card
 */
function saveCard(): void {
  error.value = '';

  if (!frontText.value.trim()) {
    error.value = 'Spanish text is required';
    return;
  }

  if (!backText.value.trim()) {
    error.value = 'English text is required';
    return;
  }

  emit('save', {
    frontText: frontText.value.trim(),
    backText: backText.value.trim()
  });
}

/**
 * Cancel editing
 */
function cancel(): void {
  emit('cancel');
}
</script>

<template>
  <div class="card-editor">
    <h3>{{ card ? 'Edit Card' : 'New Card' }}</h3>

    <div v-if="error" class="error">{{ error }}</div>

    <div class="form-group">
      <label for="front-text">Spanish</label>
      <input
        id="front-text"
        v-model="frontText"
        type="text"
        placeholder="Enter Spanish word or phrase..."
        @keyup.enter="saveCard"
        @keyup.escape="cancel"
      />
    </div>

    <div class="form-group">
      <label for="back-text">English</label>
      <input
        id="back-text"
        v-model="backText"
        type="text"
        placeholder="Enter English translation..."
        @keyup.enter="saveCard"
        @keyup.escape="cancel"
      />
    </div>

    <div class="button-group">
      <button @click="saveCard" class="save-button">
        {{ card ? 'Update' : 'Create' }}
      </button>
      <button @click="cancel" class="cancel-button">
        Cancel
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card-editor {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 1.25rem;
    color: #2c3e50;
    margin-bottom: 1.5rem;
  }
}

.error {
  background-color: #fadbd8;
  color: #c0392b;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 6px;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: #3498db;
    }

    &::placeholder {
      color: #bdc3c7;
    }
  }
}

.button-group {
  display: flex;
  gap: 0.75rem;
}

.save-button {
  flex: 1;
  padding: 0.875rem;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #229954;
  }
}

.cancel-button {
  flex: 1;
  padding: 0.875rem;
  background-color: #ecf0f1;
  color: #2c3e50;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #d5dbdb;
  }
}
</style>
