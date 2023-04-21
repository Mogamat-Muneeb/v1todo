<script setup>
import { ref, onMounted } from "vue";

import { db } from "./firebase/index";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  
  deleteDoc,
  updateDoc,
  orderBy,
  limit,
} from "firebase/firestore";

const todos = ref([]);
const todosCollection = collection(db, "todos");
const todosCollectionQuery = query(todosCollection, orderBy("date", "desc"));
onMounted(() => {
  onSnapshot(todosCollectionQuery, (querySnapshot) => {
    const fbTofodos = [];
    querySnapshot.forEach((doc) => {
      const todo = {
        id: doc.id,
        content: doc.data().content,
        done: doc.data().done,
        date: doc.data().date,
      };
      fbTofodos.push(todo);
    });
    todos.value = fbTofodos;
  });
});

const newTodoContent = ref("");
const addTodo = () => {
  addDoc(todosCollection, {
    content: newTodoContent.value,
    done: false,
    date: Date.now(),
  });
  newTodoContent.value = "";
};

const deleteTodo = (id) => {
  deleteDoc(doc(todosCollection, id));
};

const toggleDone = (id) => {
  const index = todos.value.findIndex((todo) => todo.id === id);

  updateDoc(doc(todosCollection, id), {
    done: !todos.value[index].done,
  });
};
</script>

<template>
  <div class="flex items-center justify-center w-full gap-4 px-3 pt-20 md:px-0">
    <form
      @submit.prevent="addTodo"
      class="flex items-center justify-center max-w-[450px] w-full gap-2"
    >
      <input
        type="text"
        placeholder="Add a todo"
        class="border-2 p-3 placeholder:text-[14px] border-gray-300 h-[40px] rounded-3xl w-full focus:outline-none focus:ring-0"
        v-model="newTodoContent"
      />
      <button
        :disabled="!newTodoContent"
        class="p-2 bg-blue-400 rounded-full cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="white"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </form>
  </div>

  <div v-for="todo in todos" class="px-3 md:px-0">
    <div class="flex items-center justify-center w-full gap-4 pt-5">
      <div
        class="rounded-3xl text-[14px] shadow bg-white flex items-center h-full w-[450px] p-6"
        :class="{ 'bg-green-200': todo.done }"
      >
        <div class="w-full">
          <p :class="todo.done ? 'line-through' : 'line-through-none'">
            {{ todo.content }}
          </p>
        </div>
        <div class="flex items-center justify-end w-full gap-2">
          <button
            @click="toggleDone(todo.id)"
            :class="
              todo.done
                ? 'bg-green-300 p-2 rounded-full'
                : 'bg-white p-2 rounded-full'
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              :stroke="todo.done ? 'white' : 'black'"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <button
            @click="deleteTodo(todo.id)"
            class="p-2 bg-red-400 rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="white"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
