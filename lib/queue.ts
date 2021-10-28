// @see https://medium.com/@konduruharish/queue-in-typescript-and-c-cbd936564a42
export class Queue {
    private first: QueueEntry = null;
    private last: QueueEntry = null;

    // private variable
    private _length = 0;
    get length(): number {
        return this._length;
    }
    // set length(value: number) {}

    /**
     * add a new entry at the end of the queue
     * @param data value of the queue
     */
    push(data: any): void {
        const entry = new QueueEntry(data);
        if (this._length == 0) {
            // If queue is empty, first and last will be the same.
            this.first = entry;
            this.last = entry;
        } else {
            // Add the element at the end of the linked list
            this.last.next = entry;
            this.last = entry;
        }
        this._length++;
    }
    /**
     * get the data of the first queue entry and remove it
     * @returns the data from the first queue entry
     */
    take(): any {
        if (this._length == 0) {
            return null;
        }
        // store data of first queue element
        const data = this.first.data;

        // set the next of the first as current first
        this.first = this.first.next;

        // shrink size of queue
        this._length--;

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
