import {db} from '../config/firebase.js';

const paymentsCollection = db.collection('payments');   

// Data Access Layer (Model) Functions

// 1. GET ALL PAYMENTS - OPTIMIZED with pagination
export const getPayments = async (limit = 100, offset = 0, orderBy = 'createdAt', orderDirection = 'desc') => {
    try {
      // OPTIMIZED: Add pagination and ordering
      let query = paymentsCollection.orderBy(orderBy, orderDirection);
      
      if (offset > 0) {
        // For pagination, limit the results
        query = query.limit(limit + offset);
      } else {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();

      // If the snapshot is empty, return an empty array
      if (snapshot.empty) {
        return [];
      }

      // Map through the documents and return an array of payment objects
      const payments = [];
      let count = 0;
      
      snapshot.forEach(doc => {
        // Skip offset number of records for simple pagination
        if (count >= offset && payments.length < limit) {
          payments.push({ 
            id: doc.id, 
            ...doc.data() 
          });
        }
        count++;
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

// 4. GET PAYMENTS BY DATE RANGE - OPTIMIZED
export const getPaymentsByDateRange = async (startDate, endDate, limit = 100) => {
    try {
      // Convert dates to ISO strings for better consistency
      const startISODate = new Date(startDate).toISOString();
      const endISODate = new Date(endDate).toISOString();
      
      // OPTIMIZED: Use compound query with date range and limit
      try {
        const snapshot = await paymentsCollection
          .where('paymentDate', '>=', startISODate)
          .where('paymentDate', '<=', endISODate)
          .orderBy('paymentDate', 'desc')
          .limit(limit)
          .get();

        if (snapshot.empty) {
          return [];
        }

        const payments = [];
        snapshot.forEach(doc => {
          payments.push({ 
            id: doc.id, 
            ...doc.data() 
          });
        });

        return payments;
      } catch (error) {
        // Fallback if compound index doesn't exist
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.warn("Composite index not found for payments, falling back to client-side filtering");
          return await getPaymentsByDateRangeFallback(startISODate, endISODate, limit);
        }
        throw error;
      }

    } catch (error) {
      console.error("Error in getPaymentsByDateRange model:", error);
      throw new Error('Failed to retrieve payments for the date range from the database.');
    }
  }

// Fallback function for when composite index doesn't exist
const getPaymentsByDateRangeFallback = async (startDate, endDate, limit) => {
  const snapshot = await paymentsCollection.limit(limit * 2).get(); // Get more records to filter
  
  if (snapshot.empty) {
    return [];
  }
  
  const payments = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const paymentDate = data.paymentDate;
    if (paymentDate >= startDate && paymentDate <= endDate) {
      payments.push({ 
        id: doc.id, 
        ...data 
      });
    }
  });
  
  return payments
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
    .slice(0, limit);
};

