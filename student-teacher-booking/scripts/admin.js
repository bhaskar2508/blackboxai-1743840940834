import { auth, db } from './firebase.js';
import { formatDate } from './student.js';

// Get all users with a specific role
export const getUsersByRole = async (role) => {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', role)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error(`Error getting ${role}s:`, error);
        return [];
    }
};

// Get pending appointments
export const getPendingAppointments = async () => {
    try {
        const snapshot = await db.collection('appointments')
            .where('status', '==', 'pending')
            .get();
        
        return snapshot.size;
    } catch (error) {
        console.error("Error getting pending appointments:", error);
        return 0;
    }
};

// Get pending registrations (students waiting for approval)
export const getPendingRegistrations = async () => {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'student')
            .where('approved', '==', false)
            .get();
        
        return snapshot.size;
    } catch (error) {
        console.error("Error getting pending registrations:", error);
        return 0;
    }
};

// Approve student registration
export const approveStudent = async (studentId) => {
    try {
        await db.collection('users').doc(studentId).update({
            approved: true,
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error approving student:", error);
        return false;
    }
};

// Get recent system activity
export const getRecentActivity = async (limit = 5) => {
    try {
        const snapshot = await db.collection('activity_log')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: formatDate(doc.data().timestamp)
        }));
    } catch (error) {
        console.error("Error getting recent activity:", error);
        return [];
    }
};

// Initialize admin dashboard
export const initAdminDashboard = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Load counts
    const teachers = await getUsersByRole('teacher');
    const students = await getUsersByRole('student');
    const pendingAppointments = await getPendingAppointments();
    const pendingRegistrations = await getPendingRegistrations();
    const recentActivity = await getRecentActivity();

    // Update counts
    document.getElementById('teacherCount').textContent = teachers.length;
    document.getElementById('studentCount').textContent = students.length;
    document.getElementById('pendingCount').textContent = pendingAppointments;
    document.getElementById('pendingRegistrations').textContent = pendingRegistrations;

    // Update recent activity
    const activityList = document.getElementById('recentActivity');
    if (recentActivity.length === 0) {
        activityList.innerHTML = `
            <li class="px-4 py-4">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-gray-500">No recent activity found</p>
                </div>
            </li>
        `;
    } else {
        activityList.innerHTML = recentActivity.map(activity => `
            <li class="px-4 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <i class="fas fa-${getActivityIcon(activity.type)} text-gray-500"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-900">${activity.message}</p>
                            <p class="text-sm text-gray-500">${activity.timestamp}</p>
                        </div>
                    </div>
                    ${activity.userId ? `
                    <div class="ml-2 flex-shrink-0 flex">
                        <a href="manage_${activity.role}s.html?id=${activity.userId}" 
                            class="text-sm text-blue-600 hover:text-blue-900">
                            View
                        </a>
                    </div>
                    ` : ''}
                </div>
            </li>
        `).join('');
    }
};

// Get appropriate icon for activity type
const getActivityIcon = (type) => {
    const icons = {
        'registration': 'user-plus',
        'appointment': 'calendar-alt',
        'login': 'sign-in-alt',
        'update': 'edit',
        'delete': 'trash'
    };
    return icons[type] || 'info-circle';
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminDashboard);