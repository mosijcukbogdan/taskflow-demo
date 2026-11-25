
<script setup>
import '../css/task-components.css'

import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'

import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'

import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'

// Підключаємо сховища Pinia
const taskStore = useTasksStore()
const projectStore = useProjectsStore()

// Статистика завдань
const {
  tasks,
  totalTasks,
  completedTasks,
  progressTasks,
  plannedTasks,
  completedPercent,
  activeTasks
} = storeToRefs(taskStore)

// Статистика проєктів
const {
  projectCount,
  projectStats
} = storeToRefs(projectStore)

// Обране завдання
const selectedTaskId = ref(null)

const selectedTask = computed(() =>
  tasks.value.find(
    (task) => task.id === selectedTaskId.value
  ) ?? null
)

// Назва проєкту в картці
function projectTitleFor(task) {
  return projectStore.projectTitle(
    task.projectId ?? 'general'
  )
}

// Зміна статусу
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
</script>

<template>
  <f7-page name="home" class="tf3-page">

    <f7-navbar title="TaskFlow">
      <f7-nav-right>
        <f7-link href="/about/">
          <f7-icon f7="info_circle" />
        </f7-link>
      </f7-nav-right>
    </f7-navbar>

    <div class="tf3-container">

      <!-- Заголовок -->
      <section class="tf3-hero">
        <div class="tf3-eyebrow">
          TASKFLOW / DASHBOARD
        </div>

        <h1>Панель керування</h1>

        <p>
          Контролюйте виконання завдань
          та їхні пріоритети.
          Усі дані синхронізуються через Pinia.
        </p>

        <p class="tf6-project-count">
          Проєктів у TaskFlow:
          <strong>{{ projectCount }}</strong>
        </p>
      </section>

      <!-- Основна статистика -->
      <section class="tf3-stat-grid">

        <div class="tf3-stat">
          <span class="tf3-stat-label">
            Усього завдань
          </span>

          <strong>{{ totalTasks }}</strong>
        </div>

        <div class="tf3-stat">
          <span class="tf3-stat-label">
            У роботі
          </span>

          <strong>{{ progressTasks }}</strong>
        </div>

        <div class="tf3-stat">
          <span class="tf3-stat-label">
            Виконано
          </span>

          <strong>{{ completedTasks }}</strong>
        </div>

        <div class="tf3-stat">
          <span class="tf3-stat-label">
            Заплановано
          </span>

          <strong>{{ plannedTasks }}</strong>
        </div>

      </section>

      <!-- Прогрес виконання -->
      <section class="tf3-progress-section">

        <div class="tf3-progress-heading">
          <div>
            <div class="tf3-eyebrow">
              TASK PROGRESS
            </div>

            <h2>Прогрес виконання</h2>
          </div>

          <strong class="tf3-progress-percent">
            {{ completedPercent }}%
          </strong>
        </div>

        <div
          class="tf3-progress-track"
          role="progressbar"
          :aria-valuenow="completedPercent"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Відсоток виконаних завдань"
        >
          <div
            class="tf3-progress-fill"
            :style="{
              width: completedPercent + '%'
            }"
          ></div>
        </div>

        <p class="tf3-progress-text">
          Виконано {{ completedTasks }}
          із {{ totalTasks }} завдань
        </p>

      </section>

      <!-- Огляд проєктів -->
      <section class="tf6-project-section">

        <div class="tf3-eyebrow">
          PROJECT OVERVIEW
        </div>

        <div class="tf6-project-heading">
          <div>
            <h2>Огляд проєктів</h2>

            <p>
              Кількість невиконаних завдань
              та прогрес кожного проєкту.
            </p>
          </div>

          <f7-button
            href="/tasks/"
            outline
            small
          >
            Мої завдання
          </f7-button>
        </div>

        <div class="tf6-project-grid">

          <div
            v-for="project in projectStats"
            :key="project.id"
            class="tf6-project-card"
          >
            <h3>
              {{ project.title }}
            </h3>

            <div class="tf6-project-numbers">

              <div>
                <span>Усього</span>
                <strong>{{ project.total }}</strong>
              </div>

              <div>
                <span>Невиконано</span>
                <strong>{{ project.incomplete }}</strong>
              </div>

              <div>
                <span>Виконано</span>
                <strong>{{ project.completed }}</strong>
              </div>

            </div>

            <div class="tf6-project-progress-heading">
              <span>Прогрес</span>

              <strong>
                {{ project.percent }}%
              </strong>
            </div>

            <div
              class="tf6-project-progress-track"
              role="progressbar"
              :aria-label="
                'Прогрес проєкту ' + project.title
              "
              :aria-valuenow="project.percent"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="tf6-project-progress-fill"
                :style="{
                  width: project.percent + '%'
                }"
              ></div>
            </div>

          </div>
        </div>

      </section>

      <!-- Актуальні завдання -->
      <section class="tf3-section">

        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">
              PRIORITY TASKS
            </div>

            <h2>Актуальні завдання</h2>
          </div>

          <f7-button
            href="/tasks/"
            outline
            small
          >
            Переглянути всі
          </f7-button>
        </div>

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

        <div
          v-if="activeTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in activeTasks"
            :key="task.id"
            :task="task"
            :project-title="projectTitleFor(task)"
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange"
            @task-select="handleTaskSelect"
          />
        </div>

        <div
          v-else
          class="tf3-empty"
        >
          Наразі всі завдання виконані.
        </div>

      </section>

    </div>

    <AppTabbar active="home" />

  </f7-page>
</template>

<style scoped>
/* Загальна статистика */
.tf3-stat-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

/* Прогрес завдань */
.tf3-progress-section {
  margin-top: 20px;
  padding: 24px;
  background: #142237;
  border: 1px solid #263a52;
  border-radius: 15px;
}

.tf3-progress-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.tf3-progress-heading h2 {
  margin: 8px 0 0;
  color: #ffffff;
  font-size: 20px;
}

.tf3-progress-percent {
  color: #58c7ef;
  font-size: 30px;
}

.tf3-progress-track {
  width: 100%;
  height: 14px;
  background: #263a52;
  border-radius: 20px;
  overflow: hidden;
}

.tf3-progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    #12668b,
    #58c7ef
  );
  border-radius: 20px;
  transition: width 0.3s ease;
}

.tf3-progress-text {
  margin: 14px 0 0;
  color: #aabed5;
  font-size: 13px;
}

/* Кількість проєктів */
.tf6-project-count {
  margin-top: 15px;
  color: #c5def0;
  font-size: 14px;
}

.tf6-project-count strong {
  color: #71d7ff;
  font-weight: 800;
}

/* Огляд проєктів */
.tf6-project-section {
  margin-top: 24px;
  padding: 22px;
  background: #142237;
  border: 1px solid #263a52;
  border-radius: 15px;
  color: #edf4ff;
}

.tf6-project-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.tf6-project-heading h2 {
  margin: 8px 0;
  color: #ffffff;
  font-size: 21px;
}

.tf6-project-heading p {
  margin: 0;
  color: #aabed5;
  font-size: 13px;
}

.tf6-project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.tf6-project-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid #36516d;
  border-radius: 13px;
  background: #1a3049;
}

.tf6-project-card h3 {
  margin: 0 0 18px;
  color: #ffffff;
  font-size: 17px;
  overflow-wrap: anywhere;
}

.tf6-project-numbers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.tf6-project-numbers div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tf6-project-numbers span {
  color: #aabed5;
  font-size: 11px;
}

.tf6-project-numbers strong {
  color: #edf4ff;
  font-size: 22px;
}

.tf6-project-progress-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 9px;
  color: #bcd0e3;
  font-size: 12px;
}

.tf6-project-progress-heading strong {
  color: #71d7ff;
  font-size: 15px;
}

.tf6-project-progress-track {
  width: 100%;
  height: 9px;
  border-radius: 12px;
  background: #263a52;
  overflow: hidden;
}

.tf6-project-progress-fill {
  height: 100%;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    #168fbd,
    #71d7ff
  );
  transition: width 0.3s ease;
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

/* Адаптивність */
@media (max-width: 900px) {
  .tf6-project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 740px) {
  .tf3-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tf6-project-grid {
    grid-template-columns: 1fr;
  }

  .tf6-project-section {
    padding: 16px;
  }
}
</style>
