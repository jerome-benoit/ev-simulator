import { FixedThreadPool, PoolOptions } from 'poolifier';

import Constants from '../utils/Constants';
import Utils from '../utils/Utils';
import { Worker } from 'worker_threads';
import WorkerAbstract from './WorkerAbstract';
import { WorkerData } from '../types/Worker';

export default class WorkerStaticPool<T> extends WorkerAbstract {
  private pool: StaticPool;

  /**
   * Create a new `WorkerStaticPool`.
   *
   * @param {string} workerScript
   */
  constructor(workerScript: string, numberOfThreads: number) {
    super(workerScript);
    this.pool = StaticPool.getInstance(numberOfThreads, this.workerScript);
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

class StaticPool extends FixedThreadPool<WorkerData> {
  private static instance: StaticPool;

  private constructor(numberOfThreads: number, workerScript: string, opts?: PoolOptions<Worker>) {
    super(numberOfThreads, workerScript, opts);
  }

  public static getInstance(numberOfThreads: number, workerScript: string): StaticPool {
    if (!StaticPool.instance) {
      StaticPool.instance = new StaticPool(numberOfThreads, workerScript,
        {
          exitHandler: (code) => {
            if (code !== 0) {
              console.error(`Worker stopped with exit code ${code}`);
            }
          }
        }
      );
    }
    return StaticPool.instance;
  }
}
