
import { defineStore } from 'pinia'
import { useTasksStore } from './tasks'

const similarLetters = {
  A: 'А', B: 'В', C: 'С',
  E: 'Е', H: 'Н', I: 'І',
  K: 'К', M: 'М', O: 'О',
  P: 'Р', T: 'Т', X: 'Х',
  Y: 'У',
  a: 'а', c: 'с', e: 'е',
  i: 'і', o: 'о', p: 'р',
  x: 'х', y: 'у'
}

function normalizeProjectTitle(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(
      /[ABCEHIKMOPTXYaceiopxy]/g,
      (letter) => similarLetters[letter] ?? letter
    )
    .toLocaleLowerCase('uk-UA')
}

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [
      { id: 'general', title: 'Загальні' },
      { id: 'study', title: 'Навчання' },
      { id: 'personal', title: 'Особисті' }
    ],
    nextProjectId: 1
  }),

  getters: {
    projectCount: (state) => state.projects.length,

    projectTitle: (state) => (id) =>
      state.projects.find(
        (project) => project.id === id
      )?.title ?? 'Загальні',

    projectStats(state) {
      const taskStore = useTasksStore()

      return state.projects.map((project) => {
        const projectTasks = taskStore.tasks.filter(
          (task) => task.projectId === project.id
        )

        const total = projectTasks.length

        const completed = projectTasks.filter(
          (task) => task.status === 'done'
        ).length

        const incomplete = total - completed

        const percent = total === 0
          ? 0
          : Math.round((completed / total) * 100)

        return {
          id: project.id,
          title: project.title,
          total,
          taskCount: total,
          completed,
          incomplete,
          percent
        }
      })
    }
  },

  actions: {
    addProject(rawTitle) {
      const title = String(rawTitle ?? '')
        .normalize('NFKC')
        .trim()
        .replace(/\s+/g, ' ')

      if (title.length < 3 || title.length > 40) {
        return null
      }

      const normalizedTitle =
        normalizeProjectTitle(title)

      const duplicate = this.projects.some(
        (project) =>
          normalizeProjectTitle(project.title) ===
          normalizedTitle
      )

      if (duplicate) {
        return null
      }

      const project = {
        id: `project-${this.nextProjectId}`,
        title
      }

      this.nextProjectId += 1
      this.projects.push(project)

      return project
    }
  }
})