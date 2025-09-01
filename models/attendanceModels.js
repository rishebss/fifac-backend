import { db } from '../config/firebase.js';

const attendanceCollection = db.collection('attendance');

// Data Access Layer Functions

// 1. GET ATTENDANCE FOR A STUDENT
export const getStudentAttendance = async (studentId, year, month) => {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    // Simplified query to avoid index requirement
    const snapshot = await attendanceCollection
      .where('studentId', '==', studentId)
      .get();

    if (snapshot.empty) {
      return [];
    }

    // Filter by date range in JavaScript and sort
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

    // Sort by date ascending
    return attendance.sort((a, b) => new Date(a.date) - new Date(b.date));

  } catch (error) {
    console.error("Error in getStudentAttendance model:", error);
    throw new Error('Failed to retrieve attendance records.');
  }
};

// 2. MARK ATTENDANCE
export const markAttendance = async (attendanceData) => {
  try {
    // Check if attendance already exists for this student and date
    const inputDate = new Date(attendanceData.date);
    const startOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0).toISOString();
    const endOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 23, 59, 59, 999).toISOString();
    
    // Simplified query to avoid index requirement
    const existingSnapshot = await attendanceCollection
      .where('studentId', '==', attendanceData.studentId)
      .get();
    
    // Filter by date range in JavaScript
    const existingRecords = existingSnapshot.docs.filter(doc => {
      const docDate = doc.data().date;
      return docDate >= startOfDay && docDate <= endOfDay;
    });

    if (existingRecords.length > 0) {
      // Update existing record
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
    } else {
      // Create new record
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
    }

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