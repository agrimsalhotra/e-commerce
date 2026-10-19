import { EventEmitter } from "node:events";

const orderEvents = new EventEmitter();

// Keep the default warning threshold.
// Unexpected listener growth should be investigated.

export default orderEvents;