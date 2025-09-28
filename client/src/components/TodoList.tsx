import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTodos, addTodo, removeTodo, clearTodos } from '../store/todoSlice';
import { clearAuth } from '../store/authSlice';
import { todoAPI, authAPI } from '../services/api';
import { deleteCookie } from '../utils/cookies';

const TodoList: React.FC = () => {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const { todos } = useAppSelector((state) => state.todo);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const todosData = await todoAPI.getTodos();
        dispatch(setTodos(todosData));
      } catch (err: any) {
        setError('Failed to fetch todos');
      }
    };

    fetchTodos();
  }, [dispatch]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setLoading(true);
    setError('');

    try {
      const newTodo = await todoAPI.createTodo(newTodoTitle.trim());
      dispatch(addTodo(newTodo));
      setNewTodoTitle('');
    } catch (err: any) {
      setError('Failed to add todo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await todoAPI.deleteTodo(id);
      dispatch(removeTodo(id));
    } catch (err: any) {
      setError('Failed to delete todo');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();

      // Clear cookies on the frontend
      deleteCookie('token');
      deleteCookie('user');

      dispatch(clearAuth());
      dispatch(clearTodos());
    } catch (err: any) {
      // Even if logout fails on server, clear local state and cookies
      deleteCookie('token');
      deleteCookie('user');
      dispatch(clearAuth());
      dispatch(clearTodos());
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>My Todos</h1>
        <div>
          <span style={{ marginRight: '15px' }}>Welcome, {user?.email}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={handleAddTodo} style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Enter a new todo..."
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <button
            type="submit"
            disabled={loading || !newTodoTitle.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !newTodoTitle.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Adding...' : 'Add Todo'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div>
        {todos.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
            No todos yet. Add one above!
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, color: '#336677' }}>
            {todos.map((todo) => (
              <li
                key={todo.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}
              >
                <span style={{ flex: 1 }}>{todo.title}</span>
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TodoList;