// src/core/EventBus.js
export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`EventBus error in ${event}:`, error);
                }
            });
        }
        
        // Dispatch také na document pro externí posluchače
        document.dispatchEvent(new CustomEvent(`texyla:${event}`, {
            detail: data
        }));
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const index = this.listeners.get(event).indexOf(callback);
            if (index > -1) {
                this.listeners.get(event).splice(index, 1);
            }
        }
    }
}

export default EventBus;