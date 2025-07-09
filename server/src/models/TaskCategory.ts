import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskCategory extends Document {
  name: string;
  description?: string;
}

const taskCategorySchema = new Schema<ITaskCategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITaskCategory>('TaskCategory', taskCategorySchema);
