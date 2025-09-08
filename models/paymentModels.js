import {db} from '../config/firebase.js';

const paymentsCollection = db.collection('payments');   

// Data Access Layer (Model) Functions

// 1. GET ALL PAYMENTS (ordered by latest first)
export const getPayments = async () => {
    try {
      // Get a snapshot of the entire collection ordered by createdAt descending
      const snapshot = await paymentsCollection.orderBy('createdAt', 'desc').get();

      // If the snapshot is empty, return an empty array
      if (snapshot.empty) {
        return [];
      }

      // Map through the documents and return an array of payment objects
      const payments = [];
      snapshot.forEach(doc => {
        // For each document, push an object containing the Firestore-generated ID and the document data
        payments.push({ 
          id: doc.id, 
          ...doc.data() 
        });
      });

      return payments;

    } catch (error) {
      console.error("Error in getPayments model:", error);
      throw new Error('Failed to retrieve payments from the database.');
    }
  }

// 2. GET A SINGLE PAYMENT BY ID
export const getPaymentById = async (id) => {   
    try {
      // Get a reference to a specific document by its ID
      const docRef = paymentsCollection.doc(id);
      
      // Fetch the document
      const doc = await docRef.get();
      
      // Check if the document exists
      if (!doc.exists) {
        return null; // Payment not found
      }
      
      // Return the payment data with the ID
      return { 
        id: doc.id, 
        ...doc.data() 
      };

    } catch (error) {
      console.error("Error in getPaymentById model:", error);
      throw new Error('Failed to retrieve the payment from the database.');
    }
  }

// 3. GET PAYMENTS BY STUDENT ID
export const getPaymentsByStudentId = async (studentId) => {
    try {
      // Get payments for a specific student ordered by latest first
      const snapshot = await paymentsCollection
        .where('studentId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .get();

      // If the snapshot is empty, return an empty array
      if (snapshot.empty) {
        return [];
      }

      // Map through the documents and return an array of payment objects
      const payments = [];
      snapshot.forEach(doc => {
        payments.push({ 
          id: doc.id, 
          ...doc.data() 
        });
      });

      return payments;

    } catch (error) {
      console.error("Error in getPaymentsByStudentId model:", error);
      throw new Error('Failed to retrieve payments for the student from the database.');
    }
  }

// 4. GET PAYMENTS BY DATE RANGE
export const getPaymentsByDateRange = async (startDate, endDate) => {
    try {
      // Convert dates to Firestore timestamps
      const startTimestamp = new Date(startDate);
      const endTimestamp = new Date(endDate);
      
      // Get payments within the date range ordered by latest first
      const snapshot = await paymentsCollection
        .where('paymentDate', '>=', startTimestamp)
        .where('paymentDate', '<=', endTimestamp)
        .orderBy('paymentDate', 'desc')
        .get();

      // If the snapshot is empty, return an empty array
      if (snapshot.empty) {
        return [];
      }

      // Map through the documents and return an array of payment objects
      const payments = [];
      snapshot.forEach(doc => {
        payments.push({ 
          id: doc.id, 
          ...doc.data() 
        });
      });

      return payments;

    } catch (error) {
      console.error("Error in getPaymentsByDateRange model:", error);
      throw new Error('Failed to retrieve payments for the date range from the database.');
    }
  }

