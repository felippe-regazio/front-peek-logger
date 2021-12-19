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

  constructor (options: DBOptions) {
    this.options = options;
    this.store = createStore(options.dbName, options.dbName);
    this.garbageCollector().catch(console.warn);
  }

  save(data: LogData) {
    if (this.gc) {
      clearTimeout(this.gc);
      this.gc = null;
    }

    if (!this.dedup(data)) {
      const id: string = uniqid();

      this.lastLog = {...data, key: id };
      this.gc = setTimeout(() => this.garbageCollector(), DBGC_THRESHOLD_ON_SAVE);
      
      set(id, data, this.store).catch(console.warn);
    }
  }

  dedup(data:LogData) {
    if (this.lastLog && this.lastLog.payload === data.payload) {
      const newData = { ...this.lastLog, times: this.lastLog.times++ };
      update(this.lastLog.key, () => newData, this.store);

      return true;
    }

    return false;
  }

  garbageCollector() {    
    return new Promise((resolve, reject) => {
      this.store('readwrite', idbStore => {
        const count = idbStore.count();

        count.onsuccess = async () => {
          if (count.result >= DEFAULT_DB_MAX_RECORDS) {
            let delCount: number = count.result - DEFAULT_DB_MAX_RECORDS;
            const idbIterator: IDBRequest = idbStore.openCursor(null, 'prev');

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