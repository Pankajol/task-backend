// Dummy data (use database instead in production)
let tasks = [];

// Create a new task
exports.createTask = (req, res) => {
  const { title, assignedUser, dueDate } = req.body;

  if (!title || !assignedUser || !dueDate) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  const newTask = {
    id: tasks.length + 1,
    title,
    assignedUser,
    dueDate,
    status: 'Pending',
  };

  tasks.push(newTask);
  res.status(201).json({
    message: 'Task created successfully!',
    task: newTask,
  });
};
