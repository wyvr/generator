"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueEntry = exports.Queue = void 0;
// @see https://medium.com/@konduruharish/queue-in-typescript-and-c-cbd936564a42
var Queue = /** @class */ (function () {
    function Queue() {
        this.first = null;
        this.last = null;
        this.size = 0;
    }
    Object.defineProperty(Queue.prototype, "length", {
        get: function () {
            return this.size;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * add a new entry at the end of the queue
     * @param data value of the queue
     */
    Queue.prototype.push = function (data) {
        var entry = new QueueEntry(data);
        if (this.size == 0) {
            // If queue is empty, first and last will be the same.
            this.first = entry;
            this.last = entry;
        }
        else {
            // Add the element at the end of the linked list
            this.last.next = entry;
            this.last = entry;
        }
        this.size++;
    };
    /**
     * get the data of the first queue entry and remove it
     * @returns the data from the first queue entry
     */
    Queue.prototype.take = function () {
        if (this.size == 0) {
            return null;
        }
        // store data of first queue element
        var data = this.first.data;
        // set the next of the first as current first
        this.first = this.first.next;
        // shrink size of queue
        this.size--;
        return data;
    };
    /**
     * get the data of the first queue entry without removing it
     * @returns the data from the first queue entry
     */
    Queue.prototype.view = function () {
        if (!this.first) {
            return null;
        }
        return this.first.data;
    };
    return Queue;
}());
exports.Queue = Queue;
var QueueEntry = /** @class */ (function () {
    function QueueEntry(data) {
        this.data = data;
        this.next = null;
    }
    return QueueEntry;
}());
exports.QueueEntry = QueueEntry;
//# sourceMappingURL=queue.js.map