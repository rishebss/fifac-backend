import express from 'express';
import { getStudents, getStudentById, createStudent,deleteStudent,updateStudent } from '../models/studentModels.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();


// GET /api/students - Get all students with pagination
router.get('/',authenticateToken, async (req, res) => {
  try {
    // OPTIMIZED: Add pagination support
    const { limit = 100, offset = 0, orderBy = 'createdAt', orderDirection = 'desc' } = req.query;
    
    const students = await getStudents(
      parseInt(limit), 
      parseInt(offset), 
      orderBy, 
      orderDirection
    );
    
    // Add caching headers for better performance
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': `students-${students.length}-${Date.now()}`
    });
    
    res.json({ 
      success: true,
      message: 'Students retrieved successfully!',
      data: students,
      meta: {
        count: students.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve students from the database.' 
    });
  }
});

// GET /api/students/:id - Get a single student by ID
router.get('/:id',authenticateToken, async (req, res) => {    
    try {
        const student = await getStudentById(req.params.id);
        
        if (!student) {
        return res.status(404).json({ 
            success: false,
            error: 'Student not found.' 
        });
        }
        
        res.json({ 
        success: true,
        message: 'Student retrieved successfully!',
        data: student 
        });
    } catch (error) {
        console.error('Error getting student:', error);
        res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve the student.' 
        });
    }
    }); 

// POST /api/students - Create a new student
router.post('/',authenticateToken, async (req, res) => {
    try {
      console.log('Received POST request to create student:', req.body);
      
      const { name, email, phone, address, age, level, batch  } = req.body;
      
      // Validate required fields
      if (!name || !phone ) {
        return res.status(400).json({ 
          success: false,
          error: 'Name, email, and phone are required fields.' 
        });
      }
      
      const newStudent = await createStudent({ name, email, phone, address, age, level, batch  });
      
      res.status(201).json({ 
        success: true,
        message: 'Student created successfully!',
        data: newStudent 
      });
  
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create the student.' 
      });
    }
  });   

// DELETE /api/students/:id - Delete a student by ID
router.delete('/:id',authenticateToken, async (req, res) => {   
    try {
        const success = await deleteStudent(req.params.id);
        
        if (!success) {
        return res.status(404).json({ 
            success: false,
            error: 'Student not found.' 
        });
        }
        
        res.json({ 
        success: true,
        message: 'Student deleted successfully!' 
        });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ 
        success: false,
        error: 'Failed to delete the student.' 
        });
    }
    }); 

// PUT /api/students/:id - Update a student by ID
router.put('/:id',authenticateToken, async (req, res) => {
    try {
      const updatedStudent = await updateStudent(req.params.id, req.body);
      res.json({ 
        success: true,
        message: 'Student updated successfully!',
        data: updatedStudent 
      });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update the student.' 
      });
    }
  });

export default router;