
<script setup>
import '../css/task-components.css'
import '../css/task-form.css'

import { computed, nextTick, ref } from 'vue'

import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskCounter from '../components/TaskCounter.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskListControls from '../components/TaskListControls.vue'

import {
  taskState,
  addTask,
  updateTask,
  deleteTask,
  setTaskStatus,
  setTaskPriority
} from '../store/tasks'

const selectedStatus = ref('all')
const selectedPriority = ref('all')
const selectedTaskId = ref(null)
const sortOrder = ref('newest')
const searchQuery = ref('')
const onlyIncomplete = ref(false)

const formVisible = ref(false)
const editingId = ref(null)
const formAnchor = ref(null)
const feedback = ref('')

const priorityOrder = {
  low: 1,
  medium: 2,
  high: 3
}

const statusOrder = {
  progress: 1,
  todo: 2,
  done: 3
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

    const matchesIncomplete =
      !onlyIncomplete.value ||
      task.status !== 'done'

    return (
      matchesStatus &&
      matchesPriority &&
      matchesSearch &&
      matchesIncomplete
    )
  })

  return result.sort((a, b) => {
    if (sortOrder.value === 'title') {
      return (
        a.title.localeCompare(b.title, 'uk-UA') ||
        a.id - b.id
      )
    }

    if (sortOrder.value === 'priority') {
      return (
        priorityOrder[b.priority] -
        priorityOrder[a.priority] ||
        b.id - a.id
      )
    }

    if (sortOrder.value === 'low') {
      return (
        priorityOrder[a.priority] -
        priorityOrder[b.priority] ||
        b.id - a.id
      )
    }

    if (sortOrder.value === 'status') {
      return (
        statusOrder[a.status] -
        statusOrder[b.status] ||
        b.id - a.id
      )
    }

    if (sortOrder.value === 'dueDate') {
      const first = a.dueDate || '9999-12-31'
      const second = b.dueDate || '9999-12-31'

      return (
        first.localeCompare(second) ||
        b.id - a.id
      )
    }

    if (sortOrder.value === 'dueDateDesc') {
      if (!a.dueDate && !b.dueDate) {
        return b.id - a.id
      }

      if (!a.dueDate) return 1
      if (!b.dueDate) return -1

      return (
        b.dueDate.localeCompare(a.dueDate) ||
        b.id - a.id
      )
    }

    return b.id - a.id
  })
})

const completedCount = computed(() =>
  filteredTasks.value.filter(
    (task) => task.status === 'done'
  ).length
)

const completedPercent = computed(() => {
  if (filteredTasks.value.length === 0) {
    return 0
  }

  return Math.round(
    completedCount.value /
    filteredTasks.value.length * 100
  )
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
  onlyIncomplete.value = false
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
  const task = taskState.tasks.find(
    (item) => item.id === Number(id)
  )

  if (!task) return

  formVisible.value = false
  editingId.value = task.id
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
    ? updateTask({
        ...data,
        id: editingId.value
      })
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
      : taskState.tasks[taskState.tasks.length - 1]

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

  const task = taskState.tasks.find(
    (item) => item.id === taskId
  )

  if (!task) return

  const confirmed = window.confirm(
    `Ви впевнені, що хочете видалити завдання «${task.title}»?`
  )

  if (!confirmed) return

  const deleted = deleteTask(taskId)

  if (!deleted) {
    feedback.value = 'Не вдалося видалити завдання.'
    return
  }

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
          Створюйте, редагуйте, знаходьте,
          сортуйте та видаляйте завдання.
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

      <TaskListControls
        v-model:search="searchQuery"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:sort="sortOrder"
        v-model:onlyIncomplete="onlyIncomplete"
        @reset="resetFilters"
      />

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

            <span class="tf5-percent">
              Виконано: {{ completedPercent }}%
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

        <div
          v-else-if="taskState.tasks.length === 0"
          class="tf3-empty tf5-empty-state"
        >
          <h3>Список завдань порожній</h3>

          <p>
            Усі завдання видалено.
            Створіть нове завдання, щоб
            продовжити роботу.
          </p>

          <button
            type="button"
            class="tf5-action-button"
            @click="createTask"
          >
            + Створити завдання
          </button>
        </div>

        <div
          v-else
          class="tf3-empty tf5-empty-state"
        >
          <h3>Завдань не знайдено</h3>

          <p>
            За поточними умовами
            завдань не знайдено.
          </p>

          <button
            type="button"
            class="tf5-action-button"
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

.tf5-counter-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.tf5-total-counter {
  color: #60758d;
  font-size: 14px;
}

.tf5-percent {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  background: #173b50;
  color: #75d9ed;
  border: 1px solid #267b99;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}

.tf5-empty-state {
  text-align: center;
}

.tf5-empty-state h3 {
  margin-bottom: 12px;
}

.tf5-action-button {
  min-height: 42px;
  padding: 10px 20px;
  margin-top: 15px;
  border: 1px solid #39afe0;
  border-radius: 10px;
  background: #168fbd;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.tf5-action-button:hover {
  background: #126b96;
}

@media (max-width: 680px) {
  .tf5-counter-group {
    justify-content: flex-start;
  }
}
</style>
