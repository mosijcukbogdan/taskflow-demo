
<script setup>
import { computed, ref } from 'vue'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'

const props = defineProps({
  search: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'all'
  },
  priority: {
    type: String,
    default: 'all'
  },
  project: {
    type: String,
    default: 'all'
  },
  sort: {
    type: String,
    default: 'newest'
  },
  projects: {
    type: Array,
    default: () => []
  },
  onlyIncomplete: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:search',
  'update:status',
  'update:priority',
  'update:project',
  'update:sort',
  'update:onlyIncomplete',
  'reset'
])

const taskStore = useTasksStore()
const projectStore = useProjectsStore()

const bulkProjectId = ref('')
const bulkMessage = ref('')

const bulkProject = computed(() =>
  projectStore.projectStats.find(
    (item) => item.id === bulkProjectId.value
  ) ?? null
)

const bulkCount = computed(() =>
  bulkProject.value?.taskCount ?? 0
)

function updateSearch(event) {
  emit('update:search', event.target.value)
}

function updateStatus(event) {
  emit('update:status', event.target.value)
}

function updatePriority(event) {
  emit('update:priority', event.target.value)
}

function updateProject(event) {
  emit('update:project', event.target.value)
}

function updateSort(event) {
  emit('update:sort', event.target.value)
}

function updateIncomplete(event) {
  emit('update:onlyIncomplete', event.target.checked)
}

function updateNoDueDate(event) {
  taskStore.onlyNoDueDate = event.target.checked
}

function clearSearch() {
  emit('update:search', '')
}

function resetFilters() {
  emit('reset')
}

function moveAllToProgress() {
  if (!bulkProject.value || bulkCount.value === 0) {
    return
  }

  const title = bulkProject.value.title
  const count = bulkCount.value

  const confirmed = window.confirm(
    `Перевести всі ${count} завдань проєкту «${title}» у статус «У роботі»? Це також змінить уже виконані завдання.`
  )

  if (!confirmed) {
    bulkMessage.value = 'Дію скасовано.'
    return
  }

  const result = taskStore.moveProjectTasksToProgress(
    bulkProjectId.value
  )

  if (result === null) {
    bulkMessage.value = 'Не вдалося змінити статуси.'
    return
  }

  bulkMessage.value =
    `Успішно змінено статус ${result} завдань проєкту «${title}».`
}
</script>

<template>
  <section class="tf5-panel">
    <h2>Пошук і впорядкування</h2>

    <div class="tf5-controls-grid">

      <label class="tf5-search">
        Пошук за назвою та описом

        <input
          type="search"
          :value="search"
          placeholder="Введіть назву або опис..."
          @input="updateSearch"
        />
      </label>

      <div
        v-if="search.trim()"
        class="tf6-clear-search"
      >
        <button
          type="button"
          class="tf5-btn"
          @click="clearSearch"
        >
          Очистити пошук
        </button>
      </div>

      <label>
        Статус

        <select
          :value="status"
          @change="updateStatus"
        >
          <option value="all">Усі статуси</option>
          <option value="todo">Заплановано</option>
          <option value="progress">У роботі</option>
          <option value="done">Виконано</option>
        </select>
      </label>

      <label>
        Пріоритет

        <select
          :value="priority"
          @change="updatePriority"
        >
          <option value="all">Усі пріоритети</option>
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
      </label>

      <label>
        Проєкт

        <select
          :value="project"
          @change="updateProject"
        >
          <option value="all">Усі проєкти</option>

          <option
            v-for="item in projects"
            :key="item.id"
            :value="item.id"
          >
            {{ item.title }}
          </option>
        </select>
      </label>

      <label>
        Сортування

        <select
          :value="sort"
          @change="updateSort"
        >
          <option value="newest">Спочатку нові</option>
          <option value="title">За назвою (А–Я)</option>
          <option value="priority">
            Високий пріоритет перший
          </option>
          <option value="low">
            Низький пріоритет перший
          </option>
          <option value="status">За статусом</option>
          <option value="dueDate">
            Найближчий термін перший
          </option>
          <option value="dueDateDesc">
            Найдальший термін перший
          </option>
        </select>
      </label>

    </div>

    <div class="tf6-checkboxes">
      <label class="tf6-checkbox">
        <input
          type="checkbox"
          :checked="onlyIncomplete"
          @change="updateIncomplete"
        />
        Тільки невиконані завдання
      </label>

      <label class="tf6-checkbox">
        <input
          type="checkbox"
          :checked="taskStore.onlyNoDueDate"
          @change="updateNoDueDate"
        />
        Лише без терміну
      </label>
    </div>

    <button
      type="button"
      class="tf5-btn tf6-reset"
      @click="resetFilters"
    >
      Скинути фільтри
    </button>

    <!-- Групова зміна статусів -->
    <div class="tf6-bulk-panel">
      <h3>Групова зміна статусів</h3>

      <p>
        Переведіть усі завдання вибраного проєкту
        в статус «У роботі».
      </p>

      <div class="tf6-bulk-grid">
        <label>
          Виберіть проєкт

          <select
            v-model="bulkProjectId"
            @change="bulkMessage = ''"
          >
            <option value="">Оберіть проєкт</option>

            <option
              v-for="item in projects"
              :key="item.id"
              :value="item.id"
            >
              {{ item.title }}
            </option>
          </select>
        </label>

        <button
          type="button"
          class="tf6-bulk-button"
          :disabled="bulkCount === 0"
          @click="moveAllToProgress"
        >
          Перевести всі у роботу
        </button>
      </div>

      <p v-if="bulkProject" class="tf6-bulk-info">
        Завдань у проєкті:
        <strong>{{ bulkCount }}</strong>
      </p>

      <p
        v-if="bulkMessage"
        class="tf6-bulk-message"
        role="status"
      >
        {{ bulkMessage }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.tf6-clear-search {
  grid-column: 1 / -1;
}

.tf6-clear-search .tf5-btn {
  width: 100%;
}

.tf6-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 18px;
}

.tf6-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #d7e4f5;
  font-size: 13px;
  cursor: pointer;
}

.tf6-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: #39afe0;
}

.tf6-reset {
  width: 100%;
  margin-top: 18px;
}

.tf6-bulk-panel {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #385a7a;
}

.tf6-bulk-panel h3 {
  margin: 0 0 10px;
  color: #ffffff;
  font-size: 18px;
}

.tf6-bulk-panel p {
  color: #c2d3e7;
  font-size: 13px;
}

.tf6-bulk-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  margin-top: 16px;
}

.tf6-bulk-grid label {
  display: grid;
  gap: 8px;
  color: #d7e4f5;
  font-size: 13px;
  font-weight: 600;
}

.tf6-bulk-grid select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #39526f;
  border-radius: 9px;
  background: #0c1728;
  color: #f0f7ff;
}

.tf6-bulk-button {
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid #39afe0;
  border-radius: 9px;
  background: #168fbd;
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.tf6-bulk-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tf6-bulk-info strong {
  color: #71d7ff;
}

.tf6-bulk-message {
  padding: 10px;
  border: 1px solid #385a7a;
  border-radius: 9px;
  background: #1a344f;
}

@media (max-width: 680px) {
  .tf6-bulk-grid {
    grid-template-columns: 1fr;
  }
}
</style>