import { DynamicThreadPool, PoolOptions } from 'poolifier';

import Constants from '../utils/Constants';
import Utils from '../utils/Utils';
import { Worker } from 'worker_threads';
import WorkerAbstract from './WorkerAbstract';
import { WorkerData } from '../types/Worker';

export default class WorkerDynamicPool<T> extends WorkerAbstract {
  private pool: DynamicPool;

  /**
   * Create a new `WorkerDynamicPool`.
   *
   * @param {string} workerScript
   */
  constructor(workerScript: string, min: number, max: number,) {
    super(workerScript);
    this.pool = DynamicPool.getInstance(min, max, this.workerScript);
  }

  get size(): number {
    return this.pool.workers.length;
  }

  get maxElementsPerWorker(): number {
    return null;
  }

  /**
   *
   * @return {Promise<void>}
   * @public
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async start(): Promise<void> { }

  /**
   *
   * @return {Promise<void>}
   * @public
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async stop(): Promise<void> {
    return this.pool.destroy();
  }

  /**
   *
   * @return {Promise<void>}
   * @public
   */
  public async addElement(elementData: T): Promise<void> {
    await this.pool.execute(elementData);
    // Start worker sequentially to optimize memory at startup
    await Utils.sleep(Constants.START_WORKER_DELAY);
  }
}

class DynamicPool extends DynamicThreadPool<WorkerData> {
  private static instance: DynamicPool;

  private constructor(min: number, max: number, workerScript: string, opts?: PoolOptions<Worker>) {
    super(min, max, workerScript, opts);
  }

  public static getInstance(min: number, max: number, workerScript: string): DynamicPool {
    if (!DynamicPool.instance) {
      DynamicPool.instance = new DynamicPool(min, max, workerScript,
        {
          exitHandler: (code) => {
            if (code !== 0) {
              console.error(`Worker stopped with exit code ${code}`);
            }
          }
        }
      );
    }
    return DynamicPool.instance;
  }
}
