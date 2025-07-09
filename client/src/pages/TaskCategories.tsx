import React, { useState, useEffect } from 'react';
import { taskCategoriesAPI } from '../services/api';
import { TaskCategory } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';

const TaskCategories = () => {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await taskCategoriesAPI.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (category: TaskCategory | null) => {
    setEditingCategory(category);
    setFormData(category ? { name: category.name, description: category.description || '' } : { name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await taskCategoriesAPI.update(editingCategory._id, formData);
      } else {
        await taskCategoriesAPI.create(formData);
      }
      loadCategories();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await taskCategoriesAPI.delete(id);
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Task Categories</h1>
        <button onClick={() => handleOpenModal(null)} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="card">
          <ul className="divide-y">
            {categories.map(category => (
              <li key={category._id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleOpenModal(category)} className="text-gray-500 hover:text-primary-600"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(category._id)} className="text-gray-500 hover:text-danger-600"><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingCategory ? 'Edit' : 'New'} Category</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">Name</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium">Description</label>
                <input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCategories;
