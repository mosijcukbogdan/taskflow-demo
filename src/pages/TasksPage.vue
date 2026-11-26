
<script setup>
import '../css/task-components.css'
import '../css/task-form.css'
import '../css/persistence.css'

import { computed, nextTick, ref } from 'vue'
import { storeToRefs } from 'pinia'

import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskCounter from '../components/TaskCounter.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskListControls from '../components/TaskListControls.vue'

import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import {
  persistenceState,
  retrySave
} from '../services/persistence'

const taskStore = useTasksStore()
const projectStore = useProjectsStore()

const {
  tasks,
  visibleTasks,
  searchText,
  selectedStatus,
  selectedPriority,
  selectedProject,
  sortOrder,
  onlyIncomplete,
  visibleCompletedPercent
} = storeToRefs(taskStore)

const {
  projects,
  projectStats
} = storeToRefs(projectStore)

// Стан локального збереження IndexedDB
const saveMessage = computed(() => {
  if (persistenceState.status === 'loading') {
    return 'Завантаження локальних даних…'
  }

  if (persistenceState.status === 'saving') {
    return 'Збереження змін у IndexedDB…'
  }

  if (persistenceState.status === 'saved') {
    return 'Усі зміни збережено в цьому браузері.'
  }

  return persistenceState.error ||
    'Не вдалося зберегти локальні дані.'
})

// Стан сторінки
const selectedTaskId = ref(null)
const formVisible = ref(false)
const editingId = ref(null)
const formAnchor = ref(null)
const feedback = ref('')

const newProjectTitle = ref('')
const newProjectError = ref('')

// Групова зміна статусів
const bulkProjectId = ref('')

const bulkProject = computed(() =>
  projectStats.value.find(
    project => project.id === bulkProjectId.value
  ) ?? null
)

const bulkTaskCount = computed(() =>
  bulkProject.value?.taskCount ?? 0
)

const selectedTask = computed(() =>
  tasks.value.find(
    task => task.id === selectedTaskId.value
  ) ?? null
)

const editingTask = computed(() =>
  tasks.value.find(
    task => task.id === editingId.value
  ) ?? null
)

// Створення нового проєкту
function createProject() {
  const project = projectStore.addProject(
    newProjectTitle.value
  )

  if (!project) {
    newProjectError.value =
      'Назва повинна містити 3–40 символів і не повторювати інші проєкти.'
    return
  }

  newProjectTitle.value = ''
  newProjectError.value = ''
  selectedProject.value = project.id

  feedback.value =
    `Проєкт «${project.title}» створено.`
}

// Групова зміна статусів
function moveProjectTasksToProgress() {
  if (!bulkProject.value || bulkTaskCount.value === 0) {
    return
  }

  const projectId = bulkProject.value.id
  const projectTitle = bulkProject.value.title
  const count = bulkTaskCount.value

  const confirmed = window.confirm(
    `Перевести всі завдання проєкту «${projectTitle}» (${count}) у статус «У роботі»? Це також змінить статус уже виконаних завдань.`
  )

  if (!confirmed) return

  const changedCount =
    taskStore.moveProjectTasksToProgress(projectId)

  if (changedCount === null) {
    feedback.value =
      'Не вдалося змінити статуси завдань.'
    return
  }

  feedback.value =
    `У проєкті «${projectTitle}» переведено ${changedCount} завдань у статус «У роботі».`
}

// Зміна статусу одного завдання
function handleStatusChange(payload) {
  taskStore.setTaskStatus(payload)
}

// Зміна пріоритету
function handlePriorityChange(payload) {
  taskStore.setTaskPriority(payload)
}

// Вибір завдання
function handleTaskSelect(payload) {
  selectedTaskId.value = payload.id
}

// Скидання фільтрів
function resetFilters() {
  taskStore.resetFilters()
}

// Прокручування до форми
async function scrollToForm() {
  await nextTick()

  formAnchor.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

// Відкриття форми нового завдання
async function createTask() {
  formVisible.value = false
  editingId.value = null
  feedback.value = ''

  await nextTick()

  formVisible.value = true

  await scrollToForm()
}

// Редагування завдання
async function editTask(id) {
  const task = tasks.value.find(
    item => item.id === Number(id)
  )

  if (!task) return

  formVisible.value = false
  editingId.value = task.id
  feedback.value = ''

  await nextTick()

  formVisible.value = true

  await scrollToForm()
}

// Закриття форми
function cancelForm() {
  formVisible.value = false
  editingId.value = null
}

// Збереження завдання через Pinia
function saveTask(data) {
  const isEditing = editingId.value !== null

  const saved = isEditing
    ? taskStore.updateTask({
        ...data,
        id: editingId.value
      })
    : taskStore.addTask(data)

  if (!saved) {
    feedback.value =
      'Не вдалося зберегти завдання. Перевірте дані форми.'
    return
  }

  feedback.value = isEditing
    ? `Завдання «${saved.title}» оновлено.`
    : `Завдання «${saved.title}» створено.`

  selectedTaskId.value = saved.id

  cancelForm()
  taskStore.resetFilters()
}

// Видалення з підтвердженням
function handleDelete(id) {
  const taskId = Number(id)

  const task = tasks.value.find(
    item => item.id === taskId
  )

  if (!task) return

  const confirmed = window.confirm(
    `Ви впевнені, що хочете видалити завдання «${task.title}»?`
  )

  if (!confirmed) return

  const deleted = taskStore.deleteTask(taskId)

  if (!deleted) {
    feedback.value =
      'Не вдалося видалити завдання.'
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

      <!-- Заголовок сторінки -->
      <section class="tf3-hero">
        <div class="tf3-eyebrow">
          TASKFLOW / TASK MANAGER
        </div>

        <h1>Мої завдання</h1>

        <p>
          Керуйте завданнями та проєктами.
          Усі зміни обробляються через Pinia.
        </p>

        <button
          type="button"
          class="tf4-new-task"
          @click="createTask"
        >
          + Додати завдання
        </button>
      </section>

      <!-- Повідомлення про дії -->
      <p
        v-if="feedback"
        class="tf4-feedback"
        role="status"
      >
        {{ feedback }}
      </p>

      <!-- Нове: індикатор IndexedDB -->
      <section
        class="tf7-persistence"
        :class="`tf7-persistence--${persistenceState.status}`"
        role="status"
        aria-live="polite"
      >
        <strong>
          Локальне збереження
        </strong>

        <span>
          {{ saveMessage }}
        </span>

        <button
          v-if="persistenceState.canRetry"
          type="button"
          class="tf7-retry-button"
          @click="retrySave"
        >
          Повторити збереження
        </button>
      </section>

      <!-- Блок проєктів -->
      <section class="tf6-project-panel">
        <div class="tf3-eyebrow">
          TASKFLOW / PROJECTS
        </div>

        <h2>Мої проєкти</h2>

        <p class="tf6-project-description">
          Створюйте проєкти та об'єднуйте
          завдання за спільною темою.
        </p>

        <div class="tf6-project-list">
          <div
            v-for="project in projectStats"
            :key="project.id"
            class="tf6-project-item"
          >
            <span>
              {{ project.title }}
            </span>

            <strong>
              {{ project.taskCount }}
            </strong>
          </div>
        </div>

        <!-- Створення проєкту -->
        <form
          class="tf6-project-form"
          @submit.prevent="createProject"
        >
          <label for="tf6-project-title">
            Назва нового проєкту

            <input
              id="tf6-project-title"
              v-model="newProjectTitle"
              type="text"
              maxlength="40"
              placeholder="Наприклад: Лабораторні"
              @input="newProjectError = ''"
            />
          </label>

          <button
            type="submit"
            class="tf6-project-button"
          >
            + Створити проєкт
          </button>
        </form>

        <p
          v-if="newProjectError"
          class="tf6-project-error"
          role="alert"
        >
          {{ newProjectError }}
        </p>

        <!-- Групова зміна статусів -->
        <div class="tf6-bulk-section">
          <h3>
            Групова зміна статусів
          </h3>

          <p>
            Можна перевести всі завдання вибраного
            проєкту в статус «У роботі».
          </p>

          <div class="tf6-bulk-grid">
            <label for="tf6-bulk-project">
              Виберіть проєкт

              <select
                id="tf6-bulk-project"
                v-model="bulkProjectId"
              >
                <option value="">
                  Оберіть проєкт
                </option>

                <option
                  v-for="project in projects"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.title }}
                </option>
              </select>
            </label>

            <button
              type="button"
              class="tf6-bulk-button"
              :disabled="
                !bulkProjectId || bulkTaskCount === 0
              "
              @click="moveProjectTasksToProgress"
            >
              Перевести всі у роботу
            </button>
          </div>

          <p
            v-if="bulkProject"
            class="tf6-bulk-count"
          >
            Завдань у проєкті:
            <strong>
              {{ bulkTaskCount }}
            </strong>
          </p>
        </div>
      </section>

      <!-- Форма створення та редагування -->
      <section
        v-if="formVisible"
        ref="formAnchor"
        class="tf4-form-section"
      >
        <TaskForm
          :key="editingId ?? 'new'"
          :task="editingTask"
          :projects="projects"
          @save="saveTask"
          @cancel="cancelForm"
        />
      </section>

      <!-- Пошук, сортування, фільтри -->
      <TaskListControls
        v-model:search="searchText"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:project="selectedProject"
        v-model:sort="sortOrder"
        v-model:onlyIncomplete="onlyIncomplete"
        :projects="projects"
        @reset="resetFilters"
      />

      <!-- Список завдань -->
      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">
              TASK LIST
            </div>

            <h2>
              Список завдань
            </h2>
          </div>

          <div class="tf5-counter-group">
            <TaskCounter
              :count="visibleTasks.length"
            />

            <span class="tf5-total-counter">
              із {{ tasks.length }}
            </span>

            <span class="tf5-percent">
              Виконано:
              {{ visibleCompletedPercent }}%
            </span>
          </div>
        </div>

        <!-- Обране завдання -->
        <div
          v-if="selectedTask"
          class="tf3-selected-task"
          role="status"
        >
          Обрано завдання:

          <strong>
            {{ selectedTask.title }}
          </strong>
        </div>

        <!-- Картки -->
        <div
          v-if="visibleTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in visibleTasks"
            :key="task.id"
            :task="task"
            :project-title="
              projectStore.projectTitle(task.projectId)
            "
            :editable="true"
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange"
            @task-select="handleTaskSelect"
            @edit="editTask"
            @delete="handleDelete"
          />
        </div>

        <!-- Коли немає жодного завдання -->
        <div
          v-else-if="tasks.length === 0"
          class="tf3-empty tf5-empty-state"
        >
          <h3>
            Список завдань порожній
          </h3>

          <p>
            Усі завдання видалено.
            Створіть нове завдання,
            щоб продовжити роботу.
          </p>

          <button
            type="button"
            class="tf5-action-button"
            @click="createTask"
          >
            + Створити завдання
          </button>
        </div>

        <!-- Якщо фільтри нічого не знайшли -->
        <div
          v-else
          class="tf3-empty tf5-empty-state"
        >
          <h3>
            Завдань не знайдено
          </h3>

          <p>
            За поточними умовами пошуку
            та фільтрації завдань не знайдено.
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
/* Панель проєктів */
.tf6-project-panel {
  margin: 24px 0;
  padding: 22px;
  border: 1px solid #28435f;
  border-radius: 16px;
  background: #13243a;
  color: #edf4ff;
}

.tf6-project-panel h2 {
  margin: 8px 0 12px;
  color: #ffffff;
  font-size: 22px;
}

.tf6-project-description {
  margin-bottom: 20px;
  color: #c2d3e7;
  font-size: 14px;
}

.tf6-project-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 22px;
}

.tf6-project-item {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid #385a7a;
  border-radius: 12px;
  background: #1a344f;
  color: #e4f2ff;
  font-size: 13px;
  font-weight: 600;
}

.tf6-project-item strong {
  min-width: 22px;
  text-align: center;
  color: #71d7ff;
  font-size: 15px;
}

/* Створення проєкту */
.tf6-project-form,
.tf6-bulk-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
  max-width: 680px;
}

.tf6-project-form label,
.tf6-bulk-grid label {
  display: grid;
  gap: 8px;
  color: #d7e4f5;
  font-size: 13px;
  font-weight: 600;
}

.tf6-project-form input,
.tf6-bulk-grid select {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #39526f;
  border-radius: 9px;
  background: #0c1728;
  color: #f0f7ff;
  font: inherit;
  color-scheme: dark;
}

.tf6-project-button,
.tf6-bulk-button {
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid #39afe0;
  border-radius: 9px;
  background: #168fbd;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.tf6-project-button:hover,
.tf6-bulk-button:hover:not(:disabled) {
  background: #126b96;
}

.tf6-bulk-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tf6-project-error {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #d26d6d;
  border-radius: 8px;
  background: #572a35;
  color: #ffd1d1;
}

/* Групове керування */
.tf6-bulk-section {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #385a7a;
}

.tf6-bulk-section h3 {
  margin: 0 0 8px;
  color: #ffffff;
  font-size: 17px;
}

.tf6-bulk-section > p {
  color: #c2d3e7;
  font-size: 13px;
}

.tf6-bulk-grid {
  margin-top: 14px;
}

.tf6-bulk-count {
  margin-top: 12px;
}

.tf6-bulk-count strong {
  color: #71d7ff;
}

/* Панель фільтрів */
:deep(.tf5-panel) {
  margin: 22px 0;
  padding: 20px;
  border: 1px solid #28435f;
  border-radius: 16px;
  background: #13243a;
  color: #edf4ff;
}

:deep(.tf5-panel h2) {
  margin: 0 0 18px;
  color: #ffffff;
  font-size: 19px;
}

:deep(.tf5-controls-grid) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

:deep(.tf5-controls-grid label) {
  display: grid;
  gap: 7px;
  color: #d7e4f5;
  font-size: 13px;
  font-weight: 600;
}

:deep(.tf5-search) {
  grid-column: 1 / -1;
}

:deep(.tf5-controls-grid input),
:deep(.tf5-controls-grid select) {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #39526f;
  border-radius: 9px;
  background: #0c1728;
  color: #f0f7ff;
  font: inherit;
  color-scheme: dark;
}

:deep(.tf5-btn) {
  min-height: 39px;
  padding: 9px 14px;
  border: 1px solid #526c8c;
  border-radius: 9px;
  background: #203550;
  color: #eff7ff;
  font-weight: 600;
  cursor: pointer;
}

:deep(.tf5-btn:hover) {
  filter: brightness(1.12);
}

/* Обране завдання */
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

/* Статистика списку */
.tf5-counter-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.tf5-total-counter {
  color: #91a8c1;
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

/* Порожній список */
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

/* Адаптивність */
@media (max-width: 680px) {
  .tf6-project-panel {
    padding: 16px;
  }

  .tf6-project-form,
  .tf6-bulk-grid {
    grid-template-columns: 1fr;
  }

  :deep(.tf5-controls-grid) {
    grid-template-columns: 1fr;
  }

  :deep(.tf5-search) {
    grid-column: auto;
  }

  .tf5-counter-group {
    justify-content: flex-start;
  }
}
</style>
