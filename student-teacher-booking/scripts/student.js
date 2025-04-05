import { auth, db } from './firebase.js';

// Get current student's appointments
export const getStudentAppointments = async (studentId) => {
    try {
        const snapshot = await db.collection('appointments')
            .where('studentId', '==', studentId)
            .orderBy('dateTime', 'asc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting appointments:", error);
        return [];
    }
};

// Cancel an appointment
export const cancelAppointment = async (appointmentId) => {
    try {
        await db.collection('appointments').doc(appointmentId).update({
            status: 'cancelled',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error cancelling appointment:", error);
        return false;
    }
};

// Get all teachers
export const getAllTeachers = async () => {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'teacher')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting teachers:", error);
        return [];
    }
};

// Book a new appointment
export const bookAppointment = async (appointmentData) => {
    try {
        const docRef = await db.collection('appointments').add({
            ...appointmentData,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error booking appointment:", error);
        return { success: false, error: error.message };
    }
};

// Send message to teacher
export const sendMessage = async (messageData) => {
    try {
        await db.collection('messages').add({
            ...messageData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        return true;
    } catch (error) {
        console.error("Error sending message:", error);
        return false;
    }
};

// Format date for display
export const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Initialize student dashboard
export const initStudentDashboard = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Load student data
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
        document.getElementById('studentName').textContent = 
            userDoc.data().fullName || user.email;
    }

    // Load appointments
    const appointments = await getStudentAppointments(user.uid);
    const tableBody = document.getElementById('appointmentsTable');
    
    if (appointments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    No upcoming appointments found.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = appointments.map(appointment => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-blue-500"></i>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${appointment.teacherName}</div>
                        <div class="text-sm text-gray-500">${appointment.subject}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${appointment.subject}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(appointment.dateTime)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${appointment.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}">
                    ${appointment.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${appointment.status === 'pending' ? `
                <button onclick="cancelAppointment('${appointment.id}')" 
                    class="text-red-600 hover:text-red-900 mr-3">
                    Cancel
                </button>
                ` : ''}
                <a href="messages.html?teacherId=${appointment.teacherId}" 
                    class="text-blue-600 hover:text-blue-900">
                    Message
                </a>
            </td>
        </tr>
    `).join('');
};

// Global function for cancel button
window.cancelAppointment = async (appointmentId) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        const success = await cancelAppointment(appointmentId);
        if (success) {
            alert('Appointment cancelled successfully');
            initStudentDashboard();
        } else {
            alert('Failed to cancel appointment');
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initStudentDashboard);