// @see https://medium.com/@konduruharish/queue-in-typescript-and-c-cbd936564a42
export class Queue {
    constructor() {
        this.first = undefined;
        this.last = undefined;
        this._length = 0;
    }

    // private variable
    get length() {
        return this._length;
    }

    /**
     * add a new entry at the end of the queue
     * @param data value of the queue
     */
    push(data) {
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
    take() {
        if (this._length == 0) {
            return undefined;
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
    view() {
        if (!this.first) {
            return undefined;
        }
        return this.first.data;
    }
}

export class QueueEntry {
    constructor(data) {
        this.data = data;
        this.next = undefined;
    }
}
