import { db } from '../config/firebase.js';

const attendanceCollection = db.collection('attendance');

// Data Access Layer Functions

// 1. GET ATTENDANCE FOR A STUDENT - OPTIMIZED
export const getStudentAttendance = async (studentId, year, month) => {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    // OPTIMIZED: Use compound query with date range to reduce data transfer
    const snapshot = await attendanceCollection
      .where('studentId', '==', studentId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'asc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    // Convert to array - much smaller dataset now
    const attendance = [];
    snapshot.forEach(doc => {
      attendance.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });

    return attendance;

  } catch (error) {
    console.error("Error in getStudentAttendance model:", error);
    
    // Fallback to the old method if composite index doesn't exist
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      console.warn("Composite index not found, falling back to client-side filtering");
      return await getStudentAttendanceFallback(studentId, year, month);
    }
    
    throw new Error('Failed to retrieve attendance records.');
  }
};

// Fallback function for when composite index doesn't exist
const getStudentAttendanceFallback = async (studentId, year, month) => {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
  
  const snapshot = await attendanceCollection
    .where('studentId', '==', studentId)
    .get();

  if (snapshot.empty) {
    return [];
  }

  const attendance = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    const docDate = data.date;
    if (docDate >= startDate && docDate <= endDate) {
      attendance.push({ 
        id: doc.id, 
        ...data 
      });
    }
  });

  return attendance.sort((a, b) => new Date(a.date) - new Date(b.date));
};

// 2. MARK ATTENDANCE - OPTIMIZED
export const markAttendance = async (attendanceData) => {
  try {
    // OPTIMIZED: Use precise date range query instead of fetching all records
    const inputDate = new Date(attendanceData.date);
    const startOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0).toISOString();
    const endOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 23, 59, 59, 999).toISOString();
    
    // Try optimized query first
    try {
      const existingSnapshot = await attendanceCollection
        .where('studentId', '==', attendanceData.studentId)
        .where('date', '>=', startOfDay)
        .where('date', '<=', endOfDay)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        // Update existing record
        const docId = existingSnapshot.docs[0].id;
        
        await attendanceCollection.doc(docId).update({
          status: attendanceData.status,
          notes: attendanceData.notes || '',
          updatedAt: new Date().toISOString()
        });
        
        const updatedDoc = await attendanceCollection.doc(docId).get();
        return { 
          id: updatedDoc.id, 
          ...updatedDoc.data() 
        };
      }
    } catch (error) {
      // If compound query fails, fall back to the old method
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.warn("Using fallback method for attendance check");
        
        const existingSnapshot = await attendanceCollection
          .where('studentId', '==', attendanceData.studentId)
          .get();
        
        const existingRecords = existingSnapshot.docs.filter(doc => {
          const docDate = doc.data().date;
          return docDate >= startOfDay && docDate <= endOfDay;
        });

        if (existingRecords.length > 0) {
          const docId = existingRecords[0].id;
          
          await attendanceCollection.doc(docId).update({
            status: attendanceData.status,
            notes: attendanceData.notes || '',
            updatedAt: new Date().toISOString()
          });
          
          const updatedDoc = await attendanceCollection.doc(docId).get();
          return { 
            id: updatedDoc.id, 
            ...updatedDoc.data() 
          };
        }
      } else {
        throw error;
      }
    }

    // Create new record if none exists
    const newRecord = {
      studentId: attendanceData.studentId,
      date: new Date(attendanceData.date).toISOString(),
      status: attendanceData.status,
      notes: attendanceData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await attendanceCollection.add(newRecord);
    
    const newDoc = await docRef.get();
    return { 
      id: newDoc.id, 
      ...newDoc.data() 
    };

  } catch (error) {
    console.error("Error in markAttendance model:", error);
    throw new Error('Failed to mark attendance.');
  }
};

// 3. DELETE ATTENDANCE RECORD
export const deleteAttendance = async (id) => {
  try {
    const docRef = attendanceCollection.doc(id);
    
    const doc = await docRef.get();
    if (!doc.exists) {
      return false;
    }
    
    await docRef.delete();
    return true;

  } catch (error) {
    console.error("Error in deleteAttendance model:", error);
    throw new Error('Failed to delete attendance record.');
  }
};

// 4. DELETE ATTENDANCE FOR A MONTH
export const deleteMonthlyAttendance = async (studentId, year, month) => {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    // Simplified query to avoid index requirement
    const snapshot = await attendanceCollection
      .where('studentId', '==', studentId)
      .get();

    if (snapshot.empty) {
      return { deletedCount: 0 };
    }

    // Filter by date range in JavaScript
    const docsToDelete = snapshot.docs.filter(doc => {
      const docDate = doc.data().date;
      return docDate >= startDate && docDate <= endDate;
    });

    if (docsToDelete.length === 0) {
      return { deletedCount: 0 };
    }

    const batch = db.batch();
    docsToDelete.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return { deletedCount: docsToDelete.length };

  } catch (error) {
    console.error("Error in deleteMonthlyAttendance model:", error);
    throw new Error('Failed to delete monthly attendance records.');
  }
};

// 5. GET ATTENDANCE SUMMARY
export const getAttendanceSummary = async (studentId, year, month) => {
  try {
    const attendance = await getStudentAttendance(studentId, year, month);
    
    const totalDays = new Date(year, month, 0).getDate();
    const presentDays = attendance.filter(record => record.status === 'present').length;
    const absentDays = attendance.filter(record => record.status === 'absent').length;
    const leaveDays = attendance.filter(record => record.status === 'leave').length;
    
    return {
      totalDays,
      present: presentDays,
      absent: absentDays,
      leave: leaveDays,
      percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
    };

  } catch (error) {
    console.error("Error in getAttendanceSummary model:", error);
    throw new Error('Failed to calculate attendance summary.');
  }
};