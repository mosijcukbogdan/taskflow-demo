
<script setup>
import '../css/task-components.css'
import { ref, computed } from 'vue'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import {
  taskState,
  setTaskStatus,
  setTaskPriority
} from '../store/tasks'

const selectedTaskId = ref(null)

const totalTasks = computed(() => taskState.tasks.length)

const completedTasks = computed(() =>
  taskState.tasks.filter(
    (task) => task.status === 'done'
  ).length
)

const progressTasks = computed(() =>
  taskState.tasks.filter(
    (task) => task.status === 'progress'
  ).length
)

const plannedTasks = computed(() =>
  taskState.tasks.filter(
    (task) => task.status === 'todo'
  ).length
)

const completedPercent = computed(() => {
  if (totalTasks.value === 0) return 0

  return Math.round(
    (completedTasks.value / totalTasks.value) * 100
  )
})

const activeTasks = computed(() => {
  const order = {
    high: 0,
    medium: 1,
    low: 2
  }

  return taskState.tasks
    .filter((task) => task.status !== 'done')
    .sort((a, b) => order[a.priority] - order[b.priority])
    .slice(0, 3)
})

const selectedTask = computed(() =>
  taskState.tasks.find(
    (task) => task.id === selectedTaskId.value
  )
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
      <section class="tf3-hero">
        <div class="tf3-eyebrow">
          TASKFLOW / DASHBOARD
        </div>

        <h1>Панель керування</h1>

        <p>
          Контролюйте виконання завдань
          та їхні пріоритети.
        </p>
      </section>

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
            :style="{ width: completedPercent + '%' }"
          ></div>
        </div>

        <p class="tf3-progress-text">
          Виконано {{ completedTasks }}
          із {{ totalTasks }} завдань
        </p>
      </section>

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
          <strong>{{ selectedTask.title }}</strong>
        </div>

        <div
          v-if="activeTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in activeTasks"
            :key="task.id"
            :task="task"
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange"
            @task-select="handleTaskSelect"
          />
        </div>

        <div v-else class="tf3-empty">
          Наразі всі завдання виконані.
        </div>
      </section>
    </div>

    <AppTabbar active="home" />
  </f7-page>
</template>

<style scoped>
.tf3-stat-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

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
  color: #fff;
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
  background: linear-gradient(90deg, #12668b, #58c7ef);
  border-radius: 20px;
  transition: width 0.3s ease;
}

.tf3-progress-text {
  margin: 14px 0 0;
  color: #aabed5;
  font-size: 13px;
}

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

@media (max-width: 740px) {
  .tf3-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
