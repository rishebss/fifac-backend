// models/leadModel.js
import { db } from '../config/firebase.js';

// Get a reference to the 'leads' collection in Firestore
// This is like pointing to a specific table in a database
const leadsCollection = db.collection('leads');

// Data Access Layer (Model) Functions

// 1. GET ALL LEADS
export const getLeads = async () => {
  try {
    // Get a snapshot of the entire collection
    const snapshot = await leadsCollection.orderBy('createdAt','desc').get();

    // If the snapshot is empty, return an empty array
    if (snapshot.empty) {
      return [];
    }

    // Map through the documents and return an array of lead objects
    const leads = [];
    snapshot.forEach(doc => {
      // For each document, push an object containing the Firestore-generated ID and the document data
      leads.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });

    return leads;

  } catch (error) {
    console.error("Error in getLeads model:", error);
    throw new Error('Failed to retrieve leads from the database.');
  }
};

// 2. GET A SINGLE LEAD BY ID
export const getLeadById = async (id) => {
  try {
    // Get a reference to a specific document by its ID
    const docRef = leadsCollection.doc(id);
    
    // Fetch the document
    const doc = await docRef.get();
    
    // Check if the document exists
    if (!doc.exists) {
      return null; // Lead not found
    }
    
    // Return the lead data with the ID
    return { 
      id: doc.id, 
      ...doc.data() 
    };

  } catch (error) {
    console.error("Error in getLeadById model:", error);
    throw new Error('Failed to retrieve the lead from the database.');
  }
};

// 3. CREATE A NEW LEAD
export const createLead = async (leadData) => {
  try {
    // Add a new document to the 'leads' collection
    // Firestore will automatically generate a unique ID
    const docRef = await leadsCollection.add({
      ...leadData,
      status: leadData.status || 'New', // Default status if not provided
      createdAt: new Date().toISOString() // Add timestamp
    });
    
    // Fetch the newly created document to return the complete data
    const newDoc = await docRef.get();
    
    // Return the complete lead object with the generated ID
    return { 
      id: newDoc.id, 
      ...newDoc.data() 
    };

  } catch (error) {
    console.error("Error in createLead model:", error);
    throw new Error('Failed to create a new lead in the database.');
  }
};

// 4. UPDATE A LEAD - OPTIMIZED
export const updateLead = async (id, updateData) => {
  try {
    const docRef = leadsCollection.doc(id);
    
    // Add timestamp to update data
    const updatedData = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Update the document with the new data
    await docRef.update(updatedData);
    
    // OPTIMIZED: Return constructed object instead of fetching again
    return { 
      id: id,
      ...updatedData
    };

  } catch (error) {
    console.error("Error in updateLead model:", error);
    throw new Error('Failed to update the lead in the database.');
  }
};

// 5. DELETE A LEAD
export const deleteLead = async (id) => {
  try {
    const docRef = leadsCollection.doc(id);
    
    // First, check if the document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return false; // Lead not found
    }
    
    // Delete the document
    await docRef.delete();
    return true; // Successfully deleted

  } catch (error) {
    console.error("Error in deleteLead model:", error);
    throw new Error('Failed to delete the lead from the database.');
  }
};