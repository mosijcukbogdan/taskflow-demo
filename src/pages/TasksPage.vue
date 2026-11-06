
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
const sortOrder = ref('default')
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
  { value: 'default', label: 'За замовчуванням' },
  { value: 'high', label: 'Високий → Низький' },
  { value: 'low', label: 'Низький → Високий' }
]

const priorityOrder = {
  low: 1,
  medium: 2,
  high: 3
}

const filteredTasks = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('uk-UA')

  const result = taskState.tasks.filter((task) => {
    const matchesStatus =
      selectedStatus.value === 'all' ||
      task.status === selectedStatus.value

    const matchesPriority =
      selectedPriority.value === 'all' ||
      task.priority === selectedPriority.value

    const matchesSearch =
      task.title.toLocaleLowerCase('uk-UA').includes(query)

    return matchesStatus && matchesPriority && matchesSearch
  })

  if (sortOrder.value === 'high') {
    result.sort((a, b) =>
      priorityOrder[b.priority] - priorityOrder[a.priority]
      || a.id - b.id
    )
  }

  if (sortOrder.value === 'low') {
    result.sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
      || a.id - b.id
    )
  }

  return result
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
    ? updateTask({ id: editingId.value, ...data })
    : addTask(data)

  if (!saved) {
    feedback.value =
      'Не вдалося зберегти завдання. Перевірте дані форми.'
    return
  }

  feedback.value = isEditing
    ? `Завдання «${saved.title}» оновлено.`
    : `Завдання «${saved.title}» створено.`

  cancelForm()

  selectedStatus.value = 'all'
  selectedPriority.value = 'all'
  searchQuery.value = ''
  selectedTaskId.value = saved.id
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
          Керуйте завданнями, статусами
          та пріоритетами.
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
            Пошук завдань за назвою
          </label>

          <input
            id="task-search"
            v-model="searchQuery"
            class="tf4-search-input"
            type="search"
            placeholder="Введіть назву завдання..."
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
            Сортування за пріоритетом
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
      </section>

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">
              TASK LIST
            </div>

            <h2>Список завдань</h2>
          </div>

          <TaskCounter :count="filteredTasks.length" />
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
          />
        </div>

        <div v-else class="tf3-empty">
          За обраними фільтрами
          завдань не знайдено.
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
</style>
