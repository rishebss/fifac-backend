import {db} from '../config/firebase.js';

const studentsCollection = db.collection('students');   

// Data Access Layer (Model) Functions

// 1. GET ALL STUDENTS - OPTIMIZED with pagination
export const getStudents = async (limit = 100, offset = 0, orderBy = 'createdAt', orderDirection = 'desc') => {
    try {
      // OPTIMIZED: Add pagination and ordering
      let query = studentsCollection.orderBy(orderBy, orderDirection);
      
      if (offset > 0) {
        // For pagination, we'd need to implement proper cursor-based pagination
        // For now, limit the results
        query = query.limit(limit + offset);
      } else {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
  
      // If the snapshot is empty, return an empty array
      if (snapshot.empty) {
        return [];
      }
  
      // Map through the documents and return an array of student objects
      const students = [];
      let count = 0;
      
      snapshot.forEach(doc => {
        // Skip offset number of records for simple pagination
        if (count >= offset && students.length < limit) {
          students.push({ 
            id: doc.id, 
            ...doc.data() 
          });
        }
        count++;
      });
  
      return students;
  
    } catch (error) {
      console.error("Error in getStudents model:", error);
      throw new Error('Failed to retrieve students from the database.');
    }
  }

// 2. GET A SINGLE STUDENT BY ID
export const getStudentById = async (id) => {   
    try {
      // Get a reference to a specific document by its ID
      const docRef = studentsCollection.doc(id);
      
      // Fetch the document
      const doc = await docRef.get();
      
      // Check if the document exists
      if (!doc.exists) {
        return null; // Student not found
      }
      
      // Return the student data with the ID
      return { 
        id: doc.id, 
        ...doc.data() 
      };
  
    } catch (error) {
      console.error("Error in getStudentById model:", error);
      throw new Error('Failed to retrieve the student from the database.');
    }
  }

// 3. CREATE A NEW STUDENT
export const createStudent = async (studentData) => {           
    try {
      // Add a timestamp for when the student is created
      const newStudent = {
        ...studentData,
        createdAt: new Date().toISOString()
      };
      
      // Add the new student to the collection
      const docRef = await studentsCollection.add(newStudent);
      
      // Return the newly created student with its ID
      return { 
        id: docRef.id, 
        ...newStudent 
      };
  
    } catch (error) {
      console.error("Error in createStudent model:", error);
      throw new Error('Failed to create a new student in the database.');
    }
  }     

// 4. UPDATE AN EXISTING STUDENT - OPTIMIZED
export const updateStudent = async (id, updateData) => {
    try {
      const docRef = studentsCollection.doc(id);
      
      // Add timestamp to update data
      const updatedData = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      // Update the document with the provided data
      await docRef.update(updatedData);
      
      // OPTIMIZED: Return constructed object instead of fetching again
      return { 
        id: id,
        ...updatedData
      };
  
    } catch (error) {
      console.error("Error in updateStudent model:", error);
      throw new Error('Failed to update the student in the database.');
    }
  }                     

// 5. DELETE A STUDENT
export const deleteStudent = async (id) => {
    try {
      const docRef = studentsCollection.doc(id);
      
      // Fetch the document to check if it exists
      const doc = await docRef.get();
      if (!doc.exists) {
        return false; // Student not found
      }
      
      // Delete the document
      await docRef.delete();
      return true; // Deletion successful
  
    } catch (error) {
      console.error("Error in deleteStudent model:", error);
      throw new Error('Failed to delete the student from the database.');
    }
  } 


