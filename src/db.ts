import uniqid from 'uniqid';
import { DEFAULT_DB_MAX_RECORDS, DBGC_THRESHOLD_ON_SAVE } from './constants'

import {
  set,
  clear,
  values,
  update,
  UseStore,
  createStore,
} from 'idb-keyval';

const FrontPeekDB = class {
  gc: any;
  store: UseStore;
  lastLog: LogData;
  options: DBOptions;
  maxRecords: number;

  constructor (options: DBOptions) {
    this.options = options;
    this.maxRecords = options.maxRecords || DEFAULT_DB_MAX_RECORDS;
    this.store = createStore(options.dbName, 'log');
    this.garbageCollector().catch(console.warn);
  }

  save(data: LogData): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const deduped = await this.dedup(data)
        .catch(reject);

      if (deduped) {
        resolve(deduped);
      } else {
        if (this.gc) {
          clearTimeout(this.gc);
          this.gc = null;
        }
  
        const id: string = uniqid();
        this.lastLog = {...data, key: id };
        
        await set(id, data, this.store).catch(reject);

        this.gc = setTimeout(() => { 
          this.garbageCollector().catch(console.warn);
        }, DBGC_THRESHOLD_ON_SAVE);
                
        resolve(id);
      }
    });
  }

  dedup(data:LogData): Promise<string|null> {
    return new Promise(async (resolve, reject) => {
      if (this.lastLog && this.lastLog.payload === data.payload) {
        const newData = { ...this.lastLog, times: this.lastLog.times++ };
        await update(this.lastLog.key, () => newData, this.store).catch(reject);
  
        resolve(this.lastLog.key);
      } else {
        resolve(null);
      }
    });
  }

  garbageCollector() {    
    return new Promise((resolve, reject) => {
      this.store('readwrite', idbStore => {
        const count = idbStore.count();

        count.onsuccess = async () => {
          if (count.result >= this.maxRecords) {
            let delCount: number = count.result - this.maxRecords;
            const idbIterator: IDBRequest = idbStore.openCursor(null, 'next');

            idbIterator.onsuccess = async (event: any) => {
              const cursor = event.target.result;
              
              if (delCount && cursor) {
                delCount--;
                cursor.delete();
                cursor.continue();
              } else {
                resolve(true);
              }
            }
          } else {
            resolve(true);
          }
        }
        
        count.onerror = () => {
          reject(count.error);
        }
      });
    })
  }

  dump() {
    return new Promise(async (resolve, reject) => {
      await this.garbageCollector().catch(reject);
      const data = await values(this.store).catch(reject);

      resolve(data);
    });
  }

  clear() {
    return clear(this.store);
  }
}

export default FrontPeekDB