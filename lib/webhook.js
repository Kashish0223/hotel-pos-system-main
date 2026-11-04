// Helper function: convert VAPID base64 public key to Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

// Assume you have a function/getter for user permissions
async function hasRequiredPermissions() {
    // Example: Fetch from API or context
    const user = JSON.parse(localStorage.getItem('hotel_pos_user'));
    const perms = user?.permissions || [];
    const role = (user?.role || "").toLowerCase();

    // Allow if they have explicit permissions OR if they are superadmin (*) OR if they belong to specific roles
    return (
        perms.includes('*') || 
        role === 'superadmin' || 
        role === 'manager' || 
        role === 'chef' || 
        role === 'waiter' ||
        role === 'cashier' ||
        role === 'bartender' ||
        perms.includes('manage_orders') || 
        perms.includes('kitchen_display') ||
        perms.includes('view_orders')
    );
}

// Subscribe to push notifications
export async function subscribeToPush() {
    if (!(await hasRequiredPermissions())) {
        return false;
    }
    try {
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            return false;
        }

        const swRegistration = await navigator.serviceWorker.ready;

        const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BPFJrJ_SWQGspsEfyFAXyT6xyNccyOLLbZOY5zS_rBlWaU1T9RrLRrLIbpKolKiKVYew5NyTQXfpftPa_CKVWKI'), // ← Replace with your actual public VAPID key
        });

        const token = localStorage.getItem("hotel_pos_jwt"); // ✅ Use consistent key

        // Send subscription object to your backend
        const res = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ subscription }),
        });

        if (!res.ok) {
            throw new Error('Failed to save subscription on server');
        }

        return true;
    } catch (err) {
        console.error('Push subscription failed:', err);
        return false;
    }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush() {
    try {
        const swRegistration = await navigator.serviceWorker.ready;
        const subscription = await swRegistration.pushManager.getSubscription();

        if (subscription) {
            // Unsubscribe from push service
            const unsubscribed = await subscription.unsubscribe();

            if (!unsubscribed) {
                console.warn("Unsubscribe from push service failed (but continuing)");
            }

            const token = localStorage.getItem("hotel_pos_jwt"); // ✅ Use consistent key

            // Notify backend to remove this subscription
            await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ endpoint: subscription.endpoint }),
            });

            console.log("Push notifications turned off.");
        }
    } catch (err) {
        console.error('Push unsubscription failed:', err);
        // Optional: showAlert here if you want to inform user
        // showAlert("error", "Warning", "Could not fully disable push notifications.");
    }
}