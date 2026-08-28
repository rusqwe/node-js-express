import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100);
    }
}

// Создаём singleton для глобального использования
const eventBus = new EventBus();

export { eventBus };
