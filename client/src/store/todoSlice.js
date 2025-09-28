import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  todos: [],
};

const todoSlice = createSlice({
  name: 'todo',
  initialState,
  reducers: {
    setTodos: (state, action) => {
      state.todos = action.payload;
    },
    addTodo: (state, action) => {
      state.todos.push(action.payload);
    },
    removeTodo: (state, action) => {
      state.todos = state.todos.filter(todo => todo.id !== action.payload);
    },
    clearTodos: (state) => {
      state.todos = [];
    },
  },
});

export const { setTodos, addTodo, removeTodo, clearTodos } = todoSlice.actions;
export default todoSlice.reducer;
