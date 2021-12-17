import uniqid from 'uniqid';
import { set, values, createStore, UseStore } from 'idb-keyval';

const FrontPeekDB = class {
  store: UseStore;

  constructor (options: DBOptions) {
    this.store = createStore(options.dbName, options.dbName);
  }

  save(payload: LogData) {
    set(uniqid(), payload, this.store);
  }

  dump() {
    return values(this.store);
  }
}

export default FrontPeekDB