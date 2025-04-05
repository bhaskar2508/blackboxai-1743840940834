import { auth, db } from './firebase.js';
import { formatDate } from './student.js';

// Get teacher's appointments
export const getTeacherAppointments = async (teacherId) => {
    try {
        const snapshot = await db.collection('appointments')
            .where('teacherId', '==', teacherId)
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

// Update appointment status
export const updateAppointmentStatus = async (appointmentId, status) => {
    try {
        await db.collection('appointments').doc(appointmentId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating appointment:", error);
        return false;
    }
};

// Get unread messages count
export const getUnreadMessagesCount = async (teacherId) => {
    try {
        const snapshot = await db.collection('messages')
            .where('teacherId', '==', teacherId)
            .where('read', '==', false)
            .get();
        
        return snapshot.size;
    } catch (error) {
        console.error("Error getting unread messages:", error);
        return 0;
    }
};

// Initialize teacher dashboard
export const initTeacherDashboard = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Load appointments
    const appointments = await getTeacherAppointments(user.uid);
    const tableBody = document.getElementById('appointmentsTable');
    
    if (appointments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No upcoming appointments found.
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = appointments.map(appointment => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-blue-500"></i>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${appointment.studentName}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${appointment.subject}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(appointment.dateTime)}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    ${appointment.purpose}
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
                    <button onclick="approveAppointment('${appointment.id}')" 
                        class="text-green-600 hover:text-green-900 mr-3">
                        Approve
                    </button>
                    <button onclick="rejectAppointment('${appointment.id}')" 
                        class="text-red-600 hover:text-red-900">
                        Reject
                    </button>
                    ` : ''}
                    <a href="messages.html?studentId=${appointment.studentId}" 
                        class="text-blue-600 hover:text-blue-900 ml-3">
                        Message
                    </a>
                </td>
            </tr>
        `).join('');
    }

    // Update stats
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const approvedCount = appointments.filter(a => a.status === 'approved').length;
    const unreadCount = await getUnreadMessagesCount(user.uid);
    
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('approvedCount').textContent = approvedCount;
    document.getElementById('unreadCount').textContent = unreadCount;
};

// Global functions for approve/reject buttons
window.approveAppointment = async (appointmentId) => {
    if (confirm('Are you sure you want to approve this appointment?')) {
        const success = await updateAppointmentStatus(appointmentId, 'approved');
        if (success) {
            alert('Appointment approved successfully');
            initTeacherDashboard();
        } else {
            alert('Failed to approve appointment');
        }
    }
};

window.rejectAppointment = async (appointmentId) => {
    if (confirm('Are you sure you want to reject this appointment?')) {
        const success = await updateAppointmentStatus(appointmentId, 'rejected');
        if (success) {
            alert('Appointment rejected successfully');
            initTeacherDashboard();
        } else {
            alert('Failed to reject appointment');
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initTeacherDashboard);