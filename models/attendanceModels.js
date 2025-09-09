import { db } from '../config/firebase.js';

const attendanceCollection = db.collection('attendance');

// Data Access Layer Functions

// 1. GET ATTENDANCE FOR A STUDENT - OPTIMIZED with Better Error Handling
export const getStudentAttendance = async (studentId, year, month) => {
  try {
    console.log(`🔍 Getting attendance for student ${studentId}, year: ${year}, month: ${month}`);
    
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    
    // Try OPTIMIZED compound query first
    try {
      console.log('🚀 Attempting optimized compound query...');
      const snapshot = await attendanceCollection
        .where('studentId', '==', studentId)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'asc')
        .get();

      console.log(`✅ Optimized query successful, found ${snapshot.size} records`);
      
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
      
    } catch (indexError) {
      // Check if it's specifically an index error
      if (indexError.code === 'failed-precondition' || 
          indexError.message.includes('index') ||
          indexError.message.includes('composite')) {
        console.warn('⚠️ Composite index not found, falling back to client-side filtering');
        return await getStudentAttendanceFallback(studentId, year, month);
      } else {
        // If it's a different error, log it and try fallback anyway
        console.error('❌ Unexpected error in optimized query:', indexError);
        console.log('🔄 Attempting fallback method...');
        return await getStudentAttendanceFallback(studentId, year, month);
      }
    }

  } catch (error) {
    console.error("💥 Critical error in getStudentAttendance model:", error);
    throw new Error(`Failed to retrieve attendance records: ${error.message}`);
  }
};

// Fallback function for when composite index doesn't exist - Enhanced
const getStudentAttendanceFallback = async (studentId, year, month) => {
  try {
    console.log('🔄 Using fallback method for attendance retrieval...');
    
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    console.log(`📊 Fallback - fetching all records for student ${studentId}`);
    
    const snapshot = await attendanceCollection
      .where('studentId', '==', studentId)
      .get();

    console.log(`📦 Fallback - fetched ${snapshot.size} total records`);

    if (snapshot.empty) {
      console.log('📭 No records found for student');
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

    console.log(`✅ Fallback - filtered to ${attendance.length} records in date range`);
    return attendance.sort((a, b) => new Date(a.date) - new Date(b.date));
    
  } catch (fallbackError) {
    console.error('💥 Error in fallback method:', fallbackError);
    throw new Error(`Fallback method failed: ${fallbackError.message}`);
  }
};

// 2. MARK ATTENDANCE - OPTIMIZED with Enhanced Error Handling
export const markAttendance = async (attendanceData) => {
  try {
    console.log('🎯 Marking attendance for:', attendanceData);
    
    // OPTIMIZED: Use precise date range query instead of fetching all records
    const inputDate = new Date(attendanceData.date);
    const startOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0).toISOString();
    const endOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 23, 59, 59, 999).toISOString();
    
    console.log(`📅 Date range: ${startOfDay} to ${endOfDay}`);
    
    // Try optimized compound query first
    try {
      console.log('🚀 Attempting optimized compound query for existing record...');
      const existingSnapshot = await attendanceCollection
        .where('studentId', '==', attendanceData.studentId)
        .where('date', '>=', startOfDay)
        .where('date', '<=', endOfDay)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        console.log('✏️ Updating existing attendance record');
        // Update existing record
        const docId = existingSnapshot.docs[0].id;
        
        await attendanceCollection.doc(docId).update({
          status: attendanceData.status,
          notes: attendanceData.notes || '',
          updatedAt: new Date().toISOString()
        });
        
        const updatedDoc = await attendanceCollection.doc(docId).get();
        console.log('✅ Successfully updated attendance record');
        return { 
          id: updatedDoc.id, 
          ...updatedDoc.data() 
        };
      }
      
      console.log('📝 No existing record found, will create new one');
      
    } catch (indexError) {
      // Check if it's specifically an index error
      if (indexError.code === 'failed-precondition' || 
          indexError.message.includes('index') ||
          indexError.message.includes('composite')) {
        console.warn('⚠️ Composite index not found, falling back to client-side filtering for attendance check');
        return await markAttendanceFallback(attendanceData, startOfDay, endOfDay);
      } else {
        // If it's a different error, log it and try fallback anyway
        console.error('❌ Unexpected error in optimized query:', indexError);
        console.log('🔄 Attempting fallback method...');
        return await markAttendanceFallback(attendanceData, startOfDay, endOfDay);
      }
    }

    // Create new record if none exists
    console.log('➕ Creating new attendance record');
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
    console.log('✅ Successfully created new attendance record');
    return { 
      id: newDoc.id, 
      ...newDoc.data() 
    };

  } catch (error) {
    console.error('💥 Critical error in markAttendance model:', error);
    console.error('💥 Error stack:', error.stack);
    throw new Error(`Failed to mark attendance: ${error.message}`);
  }
};

// Fallback function for marking attendance when composite index doesn't exist
const markAttendanceFallback = async (attendanceData, startOfDay, endOfDay) => {
  try {
    console.log('🔄 Using fallback method for marking attendance...');
    
    const existingSnapshot = await attendanceCollection
      .where('studentId', '==', attendanceData.studentId)
      .get();
    
    console.log(`📦 Fallback - fetched ${existingSnapshot.size} total records for student`);
    
    const existingRecords = existingSnapshot.docs.filter(doc => {
      const docDate = doc.data().date;
      return docDate >= startOfDay && docDate <= endOfDay;
    });

    if (existingRecords.length > 0) {
      console.log('✏️ Fallback - updating existing record');
      const docId = existingRecords[0].id;
      
      await attendanceCollection.doc(docId).update({
        status: attendanceData.status,
        notes: attendanceData.notes || '',
        updatedAt: new Date().toISOString()
      });
      
      const updatedDoc = await attendanceCollection.doc(docId).get();
      console.log('✅ Fallback - successfully updated attendance record');
      return { 
        id: updatedDoc.id, 
        ...updatedDoc.data() 
      };
    }
    
    // Create new record if none exists
    console.log('➕ Fallback - creating new attendance record');
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
    console.log('✅ Fallback - successfully created new attendance record');
    return { 
      id: newDoc.id, 
      ...newDoc.data() 
    };
    
  } catch (fallbackError) {
    console.error('💥 Error in attendance marking fallback method:', fallbackError);
    throw new Error(`Fallback method failed: ${fallbackError.message}`);
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