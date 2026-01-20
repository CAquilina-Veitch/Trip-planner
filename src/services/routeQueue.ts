// Rate-limited queue for OSRM route requests
// Prevents 429 errors by processing requests sequentially with delays

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface QueueItem {
  id: string;
  execute: () => Promise<void>;
  resolve: () => void;
  reject: (err: Error) => void;
}

class RouteQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private minDelay = 400; // ms between requests
  private rateLimitDelay = 3000; // ms to wait after 429

  async enqueue(id: string, execute: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      // Remove any existing request for this day (cancel old pending request)
      this.queue = this.queue.filter(item => item.id !== id);
      this.queue.push({ id, execute, resolve, reject });
      this.processNext();
    });
  }

  cancel(id: string): void {
    this.queue = this.queue.filter(item => item.id !== id);
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const item = this.queue.shift()!;

    // Ensure minimum delay between requests
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.minDelay) {
      await delay(this.minDelay - elapsed);
    }

    try {
      await item.execute();
      item.resolve();
    } catch (err) {
      // If rate limited, wait longer before next request
      if (err instanceof Error && err.message.includes('429')) {
        this.lastRequestTime = Date.now() + this.rateLimitDelay - this.minDelay;
      }
      item.reject(err as Error);
    }

    this.lastRequestTime = Date.now();
    this.processing = false;

    // Process next item
    this.processNext();
  }
}

export const routeQueue = new RouteQueue();
