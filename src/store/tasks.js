
import { defineStore } from 'pinia'
import initialTasks from '../data/tasks'
import { useProjectsStore } from './projects'

const allowedStatuses = ['todo', 'progress', 'done']
const allowedPriorities = ['low', 'medium', 'high']
const allowedCategories = ['study', 'work', 'personal']

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

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const normalized = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')

  return normalized === value
}

function getToday() {
  const date = new Date()

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

function normalizeTitle(title) {
  return String(title ?? '')
    .trim()
    .toLocaleLowerCase('uk-UA')
}

function normalizeTaskData(data, projects) {
  if (!data || typeof data !== 'object') {
    return null
  }

  const title = String(data.title ?? '').trim()
  const description = String(data.description ?? '').trim()

  const status = data.status ?? 'todo'
  const priority = data.priority ?? 'medium'
  const category = data.category ?? 'study'
  const dueDate = String(data.dueDate ?? '').trim()
  const projectId = String(data.projectId ?? 'general')

  if (title.length < 3 || title.length > 80) {
    return null
  }

  if (description.length > 500) {
    return null
  }

  if (!allowedStatuses.includes(status)) {
    return null
  }

  if (!allowedPriorities.includes(priority)) {
    return null
  }

  if (!allowedCategories.includes(category)) {
    return null
  }

  if (dueDate && !validDate(dueDate)) {
    return null
  }

  if (!projects.some(
    (project) => project.id === projectId
  )) {
    return null
  }

  return {
    title,
    description,
    status,
    priority,
    category,
    dueDate,
    projectId,
    completed: status === 'done'
  }
}

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: initialTasks.map((task) => ({
      ...task,
      category: task.category ?? 'study',
      projectId: task.projectId ?? 'general',
      completed: task.status === 'done'
    })),

    searchText: '',
    selectedStatus: 'all',
    selectedPriority: 'all',
    selectedProject: 'all',
    sortOrder: 'newest',
    onlyIncomplete: false,

    // Додаткове завдання №5
    onlyNoDueDate: false
  }),

  getters: {
    totalTasks: (state) => state.tasks.length,

    completedTasks: (state) =>
      state.tasks.filter(
        (task) => task.status === 'done'
      ).length,

    progressTasks: (state) =>
      state.tasks.filter(
        (task) => task.status === 'progress'
      ).length,

    plannedTasks: (state) =>
      state.tasks.filter(
        (task) => task.status === 'todo'
      ).length,

    completedPercent() {
      if (this.totalTasks === 0) {
        return 0
      }

      return Math.round(
        (this.completedTasks / this.totalTasks) * 100
      )
    },

    activeTasks: (state) =>
      state.tasks
        .filter((task) => task.status !== 'done')
        .sort((a, b) =>
          priorityOrder[b.priority] -
          priorityOrder[a.priority] ||
          b.id - a.id
        )
        .slice(0, 3),

    visibleTasks: (state) => {
      const query = state.searchText
        .trim()
        .toLocaleLowerCase('uk-UA')

      const result = state.tasks.filter((task) => {
        const text =
          `${task.title} ${task.description ?? ''}`
            .toLocaleLowerCase('uk-UA')

        const matchesSearch =
          !query || text.includes(query)

        const matchesStatus =
          state.selectedStatus === 'all' ||
          task.status === state.selectedStatus

        const matchesPriority =
          state.selectedPriority === 'all' ||
          task.priority === state.selectedPriority

        const matchesProject =
          state.selectedProject === 'all' ||
          task.projectId === state.selectedProject

        const matchesIncomplete =
          !state.onlyIncomplete ||
          task.status !== 'done'

        // Додаткове завдання №5:
        // показати лише завдання без терміну
        const matchesNoDueDate =
          !state.onlyNoDueDate ||
          !task.dueDate

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesProject &&
          matchesIncomplete &&
          matchesNoDueDate
        )
      })

      return result.sort((a, b) => {
        if (state.sortOrder === 'title') {
          return (
            a.title.localeCompare(b.title, 'uk-UA') ||
            a.id - b.id
          )
        }

        if (state.sortOrder === 'priority') {
          return (
            priorityOrder[b.priority] -
            priorityOrder[a.priority] ||
            b.id - a.id
          )
        }

        if (state.sortOrder === 'low') {
          return (
            priorityOrder[a.priority] -
            priorityOrder[b.priority] ||
            b.id - a.id
          )
        }

        if (state.sortOrder === 'status') {
          return (
            statusOrder[a.status] -
            statusOrder[b.status] ||
            b.id - a.id
          )
        }

        if (state.sortOrder === 'dueDate') {
          return (
            (a.dueDate || '9999-12-31')
              .localeCompare(
                b.dueDate || '9999-12-31'
              ) ||
            b.id - a.id
          )
        }

        if (state.sortOrder === 'dueDateDesc') {
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
    },

    visibleCompletedPercent() {
      if (this.visibleTasks.length === 0) {
        return 0
      }

      const completed = this.visibleTasks.filter(
        (task) => task.status === 'done'
      ).length

      return Math.round(
        (completed / this.visibleTasks.length) * 100
      )
    }
  },

  actions: {
    isTitleUnique(title, excludeId = null) {
      const normalized = normalizeTitle(title)

      return !this.tasks.some(
        (task) =>
          task.id !== Number(excludeId) &&
          normalizeTitle(task.title) === normalized
      )
    },

    addTask(data) {
      const projectStore = useProjectsStore()

      const normalized = normalizeTaskData(
        data,
        projectStore.projects
      )

      if (!normalized) return null

      if (
        normalized.dueDate &&
        normalized.dueDate < getToday()
      ) {
        return null
      }

      if (!this.isTitleUnique(normalized.title)) {
        return null
      }

      const nextId = Math.max(
        0,
        ...this.tasks.map((task) => task.id)
      ) + 1

      const newTask = {
        id: nextId,
        ...normalized
      }

      this.tasks.push(newTask)

      return newTask
    },

    updateTask({ id, ...data }) {
      const task = this.tasks.find(
        (item) => item.id === Number(id)
      )

      if (!task) return null

      const projectStore = useProjectsStore()

      const normalized = normalizeTaskData(
        data,
        projectStore.projects
      )

      if (!normalized) return null

      if (
        normalized.dueDate &&
        normalized.dueDate < getToday() &&
        normalized.dueDate !== task.dueDate
      ) {
        return null
      }

      if (!this.isTitleUnique(
        normalized.title,
        task.id
      )) {
        return null
      }

      Object.assign(task, normalized)

      return task
    },

    deleteTask(id) {
      const index = this.tasks.findIndex(
        (task) => task.id === Number(id)
      )

      if (index === -1) {
        return false
      }

      this.tasks.splice(index, 1)

      return true
    },

    setTaskStatus({ id, status }) {
      if (!allowedStatuses.includes(status)) {
        return false
      }

      const task = this.tasks.find(
        (item) => item.id === Number(id)
      )

      if (!task) return false

      task.status = status
      task.completed = status === 'done'

      return true
    },

    setTaskPriority({ id, priority }) {
      if (!allowedPriorities.includes(priority)) {
        return false
      }

      const task = this.tasks.find(
        (item) => item.id === Number(id)
      )

      if (!task) return false

      task.priority = priority

      return true
    },

    // Додаткове завдання №4:
    // групове переведення завдань проєкту
    moveProjectTasksToProgress(projectId) {
      const projectStore = useProjectsStore()

      const projectExists =
        projectStore.projects.some(
          (project) => project.id === projectId
        )

      if (!projectExists) {
        return null
      }

      const projectTasks = this.tasks.filter(
        (task) => task.projectId === projectId
      )

      for (const task of projectTasks) {
        task.status = 'progress'
        task.completed = false
      }

      return projectTasks.length
    },

    resetFilters() {
      this.searchText = ''
      this.selectedStatus = 'all'
      this.selectedPriority = 'all'
      this.selectedProject = 'all'
      this.sortOrder = 'newest'
      this.onlyIncomplete = false
      this.onlyNoDueDate = false
    }
  }
})

// Тимчасова сумісність із попередніми роботами.
// Старі компоненти можуть викликати ці функції.

export const taskState = {
  get tasks() {
    return useTasksStore().tasks
  }
}

export function isTitleUnique(
  title,
  excludeId = null
) {
  return useTasksStore().isTitleUnique(
    title,
    excludeId
  )
}

export function addTask(data) {
  return useTasksStore().addTask(data)
}

export function updateTask(data) {
  return useTasksStore().updateTask(data)
}

export function deleteTask(id) {
  return useTasksStore().deleteTask(id)
}

export function setTaskStatus(payload) {
  return useTasksStore().setTaskStatus(payload)
}

export function setTaskPriority(payload) {
  return useTasksStore().setTaskPriority(payload)
}
