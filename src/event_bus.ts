export type Event = "canvas-size-changed" | "config-changed";
export type EventCallback = () => void;

export class EventBus {
    private map_event_to_callback = new Map<Event, EventCallback[]>();
    private active_event_list: Event[] = [];
    private event_write_idx = 0;

    public emit(event: Event) {
        if (this.event_write_idx < this.active_event_list.length) {
            this.active_event_list[this.event_write_idx] = event;
            this.event_write_idx++;
        } else {
            this.active_event_list.push(event);
        }
    }

    public listen(event: Event, callback: EventCallback) {
        const callback_list = this.map_event_to_callback.get(event) ?? [];
        callback_list.push(callback);
        this.map_event_to_callback.set(event, callback_list);
    }

    public process() {
        for (let i = 0; i < this.event_write_idx; i++) {
            const callback_list = this.map_event_to_callback.get(this.active_event_list[i]) ?? [];
            for (const callback of callback_list) {
                callback();
            }
        }
        this.event_write_idx = 0;
    }
}
