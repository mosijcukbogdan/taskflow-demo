
<script setup>
import '../css/task-components.css'
import '../css/task-form.css'

import { computed, nextTick, ref } from 'vue'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskCounter from '../components/TaskCounter.vue'
import TaskForm from '../components/TaskForm.vue'

import {
  taskState,
  addTask,
  updateTask,
  setTaskStatus,
  setTaskPriority
} from '../store/tasks'

const selectedStatus = ref('all')
const selectedPriority = ref('all')
const selectedTaskId = ref(null)
const sortOrder = ref('newest')
const searchQuery = ref('')

const formVisible = ref(false)
const editingId = ref(null)
const formAnchor = ref(null)
const feedback = ref('')

const statusOptions = [
  { value: 'all', label: 'Усі' },
  { value: 'todo', label: 'Заплановано' },
  { value: 'progress', label: 'У роботі' },
  { value: 'done', label: 'Виконано' }
]

const priorityOptions = [
  { value: 'all', label: 'Усі' },
  { value: 'low', label: 'Низький' },
  { value: 'medium', label: 'Середній' },
  { value: 'high', label: 'Високий' }
]

const sortOptions = [
  { value: 'newest', label: 'Спочатку нові' },
  { value: 'title', label: 'За назвою (А–Я)' },
  { value: 'priority', label: 'Високий → Низький' },
  { value: 'low', label: 'Низький → Високий' },
  { value: 'dueDate', label: 'За терміном виконання' }
]

const priorityOrder = {
  low: 1,
  medium: 2,
  high: 3
}

const filteredTasks = computed(() => {
  const query = searchQuery.value
    .trim()
    .toLocaleLowerCase('uk-UA')

  const result = taskState.tasks.filter((task) => {
    const matchesStatus =
      selectedStatus.value === 'all' ||
      task.status === selectedStatus.value

    const matchesPriority =
      selectedPriority.value === 'all' ||
      task.priority === selectedPriority.value

    const searchableText =
      `${task.title} ${task.description ?? ''}`
        .toLocaleLowerCase('uk-UA')

    const matchesSearch =
      !query || searchableText.includes(query)

    return matchesStatus &&
      matchesPriority &&
      matchesSearch
  })

  return result.sort((a, b) => {
    if (sortOrder.value === 'title') {
      return a.title.localeCompare(b.title, 'uk-UA') ||
        a.id - b.id
    }

    if (sortOrder.value === 'priority') {
      return priorityOrder[b.priority] -
        priorityOrder[a.priority] ||
        b.id - a.id
    }

    if (sortOrder.value === 'low') {
      return priorityOrder[a.priority] -
        priorityOrder[b.priority] ||
        b.id - a.id
    }

    if (sortOrder.value === 'dueDate') {
      const first = a.dueDate || '9999-12-31'
      const second = b.dueDate || '9999-12-31'

      return first.localeCompare(second) ||
        b.id - a.id
    }

    return b.id - a.id
  })
})

const selectedTask = computed(() =>
  taskState.tasks.find(
    (task) => task.id === selectedTaskId.value
  ) ?? null
)

const editingTask = computed(() =>
  taskState.tasks.find(
    (task) => task.id === editingId.value
  ) ?? null
)

function handleStatusChange(payload) {
  setTaskStatus(payload)
}

function handlePriorityChange(payload) {
  setTaskPriority(payload)
}

function handleTaskSelect(payload) {
  selectedTaskId.value = payload.id
}

function resetFilters() {
  selectedStatus.value = 'all'
  selectedPriority.value = 'all'
  sortOrder.value = 'newest'
  searchQuery.value = ''
}

async function scrollToForm() {
  await nextTick()

  formAnchor.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

async function createTask() {
  formVisible.value = false
  editingId.value = null
  feedback.value = ''

  await nextTick()
  formVisible.value = true
  await scrollToForm()
}

async function editTask(id) {
  formVisible.value = false
  editingId.value = id
  feedback.value = ''

  await nextTick()
  formVisible.value = true
  await scrollToForm()
}

function cancelForm() {
  formVisible.value = false
  editingId.value = null
}

function saveTask(data) {
  const isEditing = editingId.value !== null

  const saved = isEditing
    ? updateTask({ ...data, id: editingId.value })
    : addTask(data)

  if (!saved) {
    feedback.value =
      'Не вдалося зберегти завдання. Перевірте дані форми.'
    return
  }

  const savedTask = typeof saved === 'object'
    ? saved
    : isEditing
      ? taskState.tasks.find(
          (task) => task.id === editingId.value
        )
      : taskState.tasks[0]

  const savedTitle = savedTask?.title ?? data.title

  feedback.value = isEditing
    ? `Завдання «${savedTitle}» оновлено.`
    : `Завдання «${savedTitle}» створено.`

  cancelForm()
  resetFilters()

  selectedTaskId.value = savedTask?.id ?? null
}

function handleDelete(id) {
  const taskId = Number(id)

  const index = taskState.tasks.findIndex(
    (task) => task.id === taskId
  )

  if (index === -1) return

  const task = taskState.tasks[index]

  const confirmed = window.confirm(
    `Ви впевнені, що хочете видалити завдання «${task.title}»?`
  )

  if (!confirmed) return

  taskState.tasks.splice(index, 1)

  if (selectedTaskId.value === taskId) {
    selectedTaskId.value = null
  }

  if (editingId.value === taskId) {
    cancelForm()
  }

  feedback.value =
    `Завдання «${task.title}» видалено.`
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">
          TASKFLOW / TASK MANAGER
        </div>

        <h1>Мої завдання</h1>

        <p>
          Керуйте завданнями, знаходьте,
          сортуйте та редагуйте їх.
        </p>

        <button
          type="button"
          class="tf4-new-task"
          @click="createTask"
        >
          + Додати завдання
        </button>
      </section>

      <p
        v-if="feedback"
        class="tf4-feedback"
        role="status"
      >
        {{ feedback }}
      </p>

      <section
        v-if="formVisible"
        ref="formAnchor"
        class="tf4-form-section"
      >
        <TaskForm
          :key="editingId ?? 'new'"
          :task="editingTask"
          @save="saveTask"
          @cancel="cancelForm"
        />
      </section>

      <section class="tf3-filters">
        <div class="tf3-filter-group">
          <label
            for="task-search"
            class="tf3-filter-title"
          >
            Пошук за назвою та описом
          </label>

          <input
            id="task-search"
            v-model="searchQuery"
            class="tf4-search-input"
            type="search"
            placeholder="Введіть назву або опис..."
            autocomplete="off"
          />
        </div>

        <div class="tf3-filter-group">
          <div class="tf3-filter-title">
            Фільтр за статусом
          </div>

          <div class="tf3-filter-buttons">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              type="button"
              class="tf3-filter-button"
              :class="{
                'is-active': selectedStatus === option.value
              }"
              :aria-pressed="selectedStatus === option.value"
              @click="selectedStatus = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="tf3-filter-group">
          <div class="tf3-filter-title">
            Фільтр за пріоритетом
          </div>

          <div class="tf3-filter-buttons">
            <button
              v-for="option in priorityOptions"
              :key="option.value"
              type="button"
              class="tf3-filter-button"
              :class="{
                'is-active': selectedPriority === option.value
              }"
              :aria-pressed="selectedPriority === option.value"
              @click="selectedPriority = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="tf3-filter-group">
          <div class="tf3-filter-title">
            Сортування завдань
          </div>

          <div class="tf3-filter-buttons">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              class="tf3-filter-button"
              :class="{
                'is-active': sortOrder === option.value
              }"
              :aria-pressed="sortOrder === option.value"
              @click="sortOrder = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="tf3-filter-group">
          <button
            type="button"
            class="tf5-reset-button"
            @click="resetFilters"
          >
            Скинути фільтри
          </button>
        </div>
      </section>

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">
              TASK LIST
            </div>

            <h2>Список завдань</h2>
          </div>

          <div class="tf5-counter-group">
            <TaskCounter :count="filteredTasks.length" />

            <span class="tf5-total-counter">
              із {{ taskState.tasks.length }}
            </span>
          </div>
        </div>

        <div
          v-if="selectedTask"
          class="tf3-selected-task"
          role="status"
        >
          Обрано завдання:
          <strong>{{ selectedTask.title }}</strong>
        </div>

        <div
          v-if="filteredTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in filteredTasks"
            :key="task.id"
            :task="task"
            :editable="true"
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange"
            @task-select="handleTaskSelect"
            @edit="editTask"
            @delete="handleDelete"
          />
        </div>

        <div v-else class="tf3-empty">
          <p>
            За поточними умовами завдань не знайдено.
          </p>

          <button
            type="button"
            class="tf5-reset-button"
            @click="resetFilters"
          >
            Показати всі завдання
          </button>
        </div>
      </section>
    </div>

    <AppTabbar active="tasks" />
  </f7-page>
</template>

<style scoped>
.tf3-selected-task {
  margin-bottom: 18px;
  padding: 16px;
  background: #183451;
  border: 1px solid #35b4e5;
  border-radius: 12px;
  color: #edf4ff;
}

.tf3-selected-task strong {
  color: #58c7ef;
}

.tf4-search-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 46px;
  padding: 12px 15px;
  border: 1px solid #42617d;
  border-radius: 10px;
  background: #0c192b;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
}

.tf4-search-input::placeholder {
  color: #8fa7bf;
}

.tf4-search-input:focus {
  outline: 2px solid #49bce7;
  outline-offset: 2px;
}

.tf5-reset-button {
  min-height: 42px;
  padding: 10px 20px;
  border: 1px solid #49bce7;
  border-radius: 10px;
  background: #126b96;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.tf5-reset-button:hover {
  background: #168bbd;
}

.tf5-counter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tf5-total-counter {
  color: #60758d;
  font-size: 14px;
}
</style>