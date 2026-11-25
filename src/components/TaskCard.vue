
<script setup>
import { computed } from 'vue'
import StatusBadge from './StatusBadge.vue'
import PriorityBadge from './PriorityBadge.vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  projectTitle: {
    type: String,
    default: 'Загальні'
  },
  editable: {
    type: Boolean,
    default: false
  },
  showManagementActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'status-change',
  'priority-change',
  'task-select',
  'edit',
  'delete'
])

const statusSequence = ['todo', 'progress', 'done']
const prioritySequence = ['low', 'medium', 'high']

const categoryLabels = {
  study: 'Навчання',
  work: 'Робота',
  personal: 'Особисте'
}

const categoryText = computed(() =>
  categoryLabels[props.task.category] || 'Навчання'
)

const statusActionText = computed(() => ({
  todo: 'Взяти в роботу',
  progress: 'Завершити',
  done: 'Повернути в план'
})[props.task.status] || 'Змінити статус')

const formattedDate = computed(() => {
  if (!props.task.dueDate) {
    return 'Без терміну'
  }

  const date = new Date(
    `${props.task.dueDate}T12:00:00`
  )

  if (Number.isNaN(date.getTime())) {
    return 'Дата не визначена'
  }

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date)
})

function changeStatus() {
  const index = statusSequence.indexOf(
    props.task.status
  )

  const nextStatus = statusSequence[
    (index + 1) % statusSequence.length
  ]

  emit('status-change', {
    id: props.task.id,
    status: nextStatus
  })
}

function changePriority() {
  const index = prioritySequence.indexOf(
    props.task.priority
  )

  const nextPriority = prioritySequence[
    (index + 1) % prioritySequence.length
  ]

  emit('priority-change', {
    id: props.task.id,
    priority: nextPriority
  })
}

function selectTask() {
  emit('task-select', {
    id: props.task.id
  })
}

function editTask() {
  emit('edit', props.task.id)
}

function requestDelete() {
  emit('delete', props.task.id)
}
</script>

<template>
  <f7-card class="tf3-task-card">
    <f7-card-content>

      <div class="tf3-card-heading">
        <h3 class="tf3-card-title">
          {{ task.title }}
        </h3>

        <StatusBadge :status="task.status" />
      </div>

      <p class="tf3-card-description">
        {{ task.description || 'Без опису' }}
      </p>

      <div class="tf3-card-meta">

        <div class="tf3-meta-item">
          <span class="tf3-meta-label">
            Пріоритет:
          </span>

          <PriorityBadge
            :priority="task.priority"
          />
        </div>

        <div class="tf3-meta-item">
          <span class="tf3-meta-label">
            Категорія:
          </span>

          <span class="tf3-category">
            {{ categoryText }}
          </span>
        </div>

        <div class="tf3-meta-item">
          <span class="tf3-meta-label">
            Проєкт:
          </span>

          <span class="tf6-project-badge">
            {{ projectTitle }}
          </span>
        </div>

        <div class="tf3-meta-date">
          Термін: {{ formattedDate }}
        </div>
      </div>

      <div class="tf3-card-actions">

        <button
          type="button"
          class="tf3-action tf3-action--primary"
          @click="changeStatus"
        >
          {{ statusActionText }}
        </button>

        <button
          type="button"
          class="tf3-action"
          @click="changePriority"
        >
          Змінити пріоритет
        </button>

        <button
          type="button"
          class="tf3-action"
          @click="selectTask"
        >
          Обрати завдання
        </button>

        <button
          v-if="editable || showManagementActions"
          type="button"
          class="tf3-action"
          @click="editTask"
        >
          Редагувати
        </button>

        <button
          v-if="editable || showManagementActions"
          type="button"
          class="tf3-action tf5-danger"
          @click="requestDelete"
        >
          Видалити
        </button>

      </div>
    </f7-card-content>
  </f7-card>
</template>

<style scoped>
.tf3-category {
  display: inline-block;
  padding: 5px 11px;
  border-radius: 20px;
  background: #253c60;
  color: #bbd5ff;
  font-size: 11px;
  font-weight: 700;
}

.tf6-project-badge {
  display: inline-block;
  padding: 5px 11px;
  border-radius: 20px;
  background: #174c5c;
  color: #80e3f6;
  font-size: 11px;
  font-weight: 700;
}

.tf5-danger {
  border: 1px solid #b85d6a;
  background: #402333;
  color: #ffb6be;
}

.tf5-danger:hover {
  background: #632d40;
}
</style>
