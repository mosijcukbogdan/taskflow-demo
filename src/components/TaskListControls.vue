
<script setup>
defineProps({
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
  sort: {
    type: String,
    default: 'newest'
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
  'update:sort',
  'update:onlyIncomplete',
  'reset'
])
</script>

<template>
  <section
    class="tf5-panel"
    aria-label="Пошук і фільтри"
  >
    <h2>Пошук і впорядкування</h2>

    <div class="tf5-controls-grid">
      <label class="tf5-search">
        Пошук за назвою та описом

        <input
          type="search"
          :value="search"
          placeholder="Введіть назву або опис..."
          @input="emit('update:search', $event.target.value)"
        />
      </label>

      <div
        v-if="search.trim()"
        class="tf5-search-actions"
      >
        <button
          type="button"
          class="tf5-btn"
          @click="emit('update:search', '')"
        >
          Очистити пошук
        </button>
      </div>

      <label>
        Статус

        <select
          :value="status"
          @change="emit('update:status', $event.target.value)"
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
          @change="emit('update:priority', $event.target.value)"
        >
          <option value="all">Усі пріоритети</option>
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
      </label>

      <label>
        Сортування

        <select
          :value="sort"
          @change="emit('update:sort', $event.target.value)"
        >
          <option value="newest">
            Спочатку нові
          </option>

          <option value="title">
            За назвою (А–Я)
          </option>

          <option value="priority">
            За пріоритетом (високий перший)
          </option>

          <option value="low">
            За пріоритетом (низький перший)
          </option>

          <option value="dueDate">
            За терміном (найближчий перший)
          </option>

          <option value="dueDateDesc">
            За терміном (найдальший перший)
          </option>

          <option value="status">
            За статусом
          </option>
        </select>
      </label>
    </div>

    <label class="tf5-quick-filter">
      <input
        type="checkbox"
        :checked="onlyIncomplete"
        @change="emit('update:onlyIncomplete', $event.target.checked)"
      />

      Тільки невиконані
    </label>

    <button
      type="button"
      class="tf5-btn tf5-reset"
      @click="emit('reset')"
    >
      Скинути фільтри
    </button>
  </section>
</template>

<style scoped>
.tf5-panel {
  margin: 22px 0;
  padding: 20px;
  border: 1px solid #28435f;
  border-radius: 16px;
  background: #13243a;
  color: #edf4ff;
}

.tf5-panel h2 {
  margin: 0 0 18px;
  font-size: 19px;
  color: #ffffff;
}

.tf5-controls-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.tf5-controls-grid label {
  display: grid;
  gap: 7px;
  color: #d7e4f5;
  font-size: 13px;
  font-weight: 600;
}

.tf5-controls-grid input,
.tf5-controls-grid select {
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
}

.tf5-search,
.tf5-search-actions {
  grid-column: 1 / -1;
}

.tf5-search-actions {
  display: flex;
  justify-content: flex-start;
}

.tf5-quick-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.tf5-quick-filter input {
  width: 18px;
  height: 18px;
  accent-color: #168fbd;
}

.tf5-btn {
  min-height: 42px;
  padding: 10px 16px;
  border: 1px solid #526c8c;
  border-radius: 9px;
  background: #203550;
  color: #eff7ff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.tf5-btn:hover {
  filter: brightness(1.12);
}

.tf5-reset {
  width: 100%;
  background: #168fbd;
  border-color: #39afe0;
  color: #ffffff;
}

@media (max-width: 680px) {
  .tf5-controls-grid {
    grid-template-columns: 1fr;
  }

  .tf5-panel {
    padding: 16px;
  }

  .tf5-search,
  .tf5-search-actions {
    grid-column: auto;
  }
}
</style>
