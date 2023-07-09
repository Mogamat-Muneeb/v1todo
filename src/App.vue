<script setup>
import { ref, onMounted, watchEffect, computed } from "vue";
import {
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
  getAuth,
} from "firebase/auth";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

import { db, auth } from "./firebase/index";
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
  getDoc,
  setDoc,
} from "firebase/firestore";

const todos = ref([]);
const todosCollection = collection(db, "todos");
const todosCollectionQuery = query(todosCollection);
const provider = new GoogleAuthProvider();
const user = ref(null);
const searchQuery = ref("");

const isAuthenticated = ref(false);
const authInstance = getAuth();

authInstance.onAuthStateChanged((firebaseUser) => {
  if (firebaseUser) {
    // isAuthenticated.value = true;
    user.value = firebaseUser;
  }
});
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const userTodosQuery = query(
        todosCollection,
        where("uid", "==", user.uid),
        orderBy("date", "asc")
      );

      onSnapshot(userTodosQuery, (querySnapshot) => {
        const fbTodos = [];
        querySnapshot.forEach((doc) => {
          const todo = {
            id: doc.id,
            content: doc.data().content,
            done: doc.data().done,
            date: doc.data().date,
          };

          fbTodos.push(todo);
        });
        todos.value = fbTodos;
      });
    }
  });
});

const newTodoContent = ref("");
const addTodo = () => {
  addDoc(todosCollection, {
    content: newTodoContent.value,
    done: false,
    date: Date.now(),
    uid: user.value.uid,
  });
  toast.success("Added a new todo!!");
  newTodoContent.value = "";
};

const deleteTodo = (id) => {
  deleteDoc(doc(todosCollection, id));
  toast.success("Deleted succesfully!!");
};

const toggleDone = (id) => {
  const index = todos.value.findIndex((todo) => todo.id === id);

  updateDoc(doc(todosCollection, id), {
    done: !todos.value[index].done,
  });
  toast.success("Congratulations todo completed!!");
};

const editingTodo = ref(null);
const editTodo = (todo) => {
  editingTodo.value = todo.id;
  toast.success("Edit a todo!!");
};

const saveTodo = (todo) => {
  updateDoc(doc(todosCollection, todo.id), {
    content: todo.content,
  });
  toast.success("Saved succesfully!!");
  editingTodo.value = null;
};

const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  const userRef = doc(db, "users", result.user.uid);
  const docSnapshot = await getDoc(userRef);

  if (!docSnapshot.exists()) {
    await setDoc(userRef, {
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
    });

    await sendEmailVerification(result.user);
    toast.success("Signed in successfully!!");
  }
};

const signUserOut = async () => {
  if (auth) {
    await signOut(auth);
    toast.success("Signed out successfully!!");
    user.value = null;
  }
};

const undoneTodoCount = computed(() => {
  return todos.value.filter((todo) => !todo.done).length;
});

const filteredTodos = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return todos.value.filter((todo) => {
    return todo.content.toLowerCase().includes(query);
  });
});
</script>

<template>
  <div v-if="user">
    <div class="bg-blue-400">
      <div
        class="flex justify-between max-w-[1280px] mx-auto w-full h-[40px] items-center text-white px-4 lg:px-0 md:px-4"
      >
        <button @click="signUserOut()" class="cursor-pointer font-semibold text-[14px]">Sign Out</button>
        <h1 class="font-bold text-[24px]">v1todo</h1>
        <p class="font-semibold text-[14px]">
          {{ user.displayName }}
        </p>
      </div>
    </div>
    <div
      class="sticky top-0 bg-white flex flex-col items-center justify-center w-full gap-4 px-3 pt-20 md:px-0 max-h-[500px] max-w-[1280px] mx-auto overflow-y-auto"
    >
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
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </form>
      <div class="max-w-[450px] mx-auto w-full">
        <input
          type="text"
          placeholder="Search a todo..."
          class="border-2 p-3 placeholder:text-[14px] border-gray-300 h-[40px] rounded-3xl w-full focus:outline-none focus:ring-0"
          v-model="searchQuery"
        />
      </div>
      <p class="font-bold text-red-400">Undone: {{ undoneTodoCount }}</p>
    </div>
    <div class="">
      <div v-for="todo in filteredTodos" :key="todo.id" class="px-3 md:px-0">
        <div class="flex items-center justify-center w-full gap-4 pt-5">
          <div
            class="rounded-3xl text-[14px] shadow bg-white flex items-center h-full w-[450px] p-6"
            :class="{ 'bg-green-400': todo.done }"
          >
            <div class="flex flex-col w-full">
              <p
                v-if="editingTodo !== todo.id"
                :class="todo.done ? 'line-through' : 'line-through-none'"
              >
                {{ todo.content }}
              </p>
              <input
                v-else
                type="text"
                class="border-2 p-3 placeholder:text-[14px] border-gray-300 h-[40px] rounded-3xl w-full focus:outline-none focus:ring-0"
                :value="todo.content"
                @input="todo.content = $event.target.value"
              />
              <div v-if="editingTodo === todo.id" class="flex gap-2">
                <button
                  @click="saveTodo(todo)"
                  class="p-2 text-[14px] text-blue-400"
                >
                  Save
                </button>
                <button
                  @click="editingTodo = null"
                  class="p-2 text-[14px] text-red-400"
                >
                  Cancel
                </button>
              </div>
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
                @click="editTodo(todo)"
                class="p-2 bg-yellow-400 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  fill="white"
                  height="16px"
                  width="16px"
                  version="1.1"
                  viewBox="0 0 512 512"
                  enable-background="new 0 0 512 512"
                >
                  <g>
                    <g>
                      <path
                        d="m455.1,137.9l-32.4,32.4-81-81.1 32.4-32.4c6.6-6.6 18.1-6.6 24.7,0l56.3,56.4c6.8,6.8 6.8,17.9 0,24.7zm-270.7,271l-81-81.1 209.4-209.7 81,81.1-209.4,209.7zm-99.7-42l60.6,60.7-84.4,23.8 23.8-84.5zm399.3-282.6l-56.3-56.4c-11-11-50.7-31.8-82.4,0l-285.3,285.5c-2.5,2.5-4.3,5.5-5.2,8.9l-43,153.1c-2,7.1 0.1,14.7 5.2,20 5.2,5.3 15.6,6.2 20,5.2l153-43.1c3.4-0.9 6.4-2.7 8.9-5.2l285.1-285.5c22.7-22.7 22.7-59.7 0-82.5z"
                      />
                    </g>
                  </g>
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
                  class="w-4 h-4"
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
    </div>
  </div>
  <div v-else class="flex content-center justify-center p-4">
    <div class="flex flex-col items-center justify-center">
      <h1 class="text-2xl font-bold text-center">v1Todo</h1>
      <button
        class="bg-black text-white rounded h-[45px] w-[160px] mt-4 font-medium shadow-lg"
        @click="signInWithGoogle()"
      >
        Sign In
      </button>
    </div>
  </div>
</template>
