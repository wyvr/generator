// @see https://medium.com/@konduruharish/queue-in-typescript-and-c-cbd936564a42
export class Queue {
    private first: QueueEntry = null;
    private last: QueueEntry = null;
    private size: number = 0;

    public get length(): number {
        return this.size;
    }

    /**
     * add a new entry at the end of the queue
     * @param data value of the queue
     */
    push(data: any): void {
        const entry = new QueueEntry(data);
        if (this.size == 0) {
            // If queue is empty, first and last will be the same.
            this.first = entry;
            this.last = entry;
        } else {
            // Add the element at the end of the linked list
            this.last.next = entry;
            this.last = entry;
        }
        this.size++;
    }
    /**
     * get the data of the first queue entry and remove it
     * @returns the data from the first queue entry
     */
    take(): any {
        if (this.size == 0) {
            return null;
        }
        // store data of first queue element
        const data = this.first.data;

        // set the next of the first as current first
        this.first = this.first.next;

        // shrink size of queue
        this.size--;

        return data;
    }
    /**
     * get the data of the first queue entry without removing it
     * @returns the data from the first queue entry
     */
    view(): any {
        if (!this.first) {
            return null;
        }
        return this.first.data;
    }
}

export class QueueEntry {
    next: QueueEntry = null;
    constructor(public data: any) {}
}
