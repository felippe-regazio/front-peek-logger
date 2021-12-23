import FrontPeekDB from './db'
import utils from './utils'

import {
  DEFAULT_LOG_LEVELS,
  DEFAULT_DATABASE_NAME,
  DEFAULT_DB_MAX_RECORDS,
  DEFAULT_UNKNOWN_LOG_LEVEL
} from './constants'

export default class FrontPeekLogger {
  db: any;
  disabled: boolean = false;
  options: FrontPeekOptions;
  logLevels: LogLevels = { ...DEFAULT_LOG_LEVELS };

  constructor(options: FrontPeekOptions = {}) {
    const dbName = options.dbName || DEFAULT_DATABASE_NAME;
    const maxRecords = options.maxRecords || DEFAULT_DB_MAX_RECORDS;

    try {
      this.options = options || {};
      this.registerLogLevels();
      
      this.db = new FrontPeekDB({ dbName, maxRecords });
    } catch(error) {
      console.error(error);
      this.disabled = true;
    }
  }

  registerLogLevels() {
    for(const [ level, severity ] of Object.entries(this.logLevels)) {
      this.log[severity.toLowerCase()] = (message: string, cb?: Function) => {
        this.log(Number(level), message, cb);
      }
    }
  }

  log(level: number | string, payload: string, cb?: Function) {
    if (this.disabled || !payload) {
      return false;
    }

    if (typeof payload !== 'string') {
      console.warn('Front Peek log skipped: Tried to store a non string value:');
      console.trace(payload);

      return false;
    }

    const date = String(new Date());
    const levelInfo = this.explainLogLevel(level);
    const matter: LogData = { ...levelInfo, payload, date, times: 1 };
    
    const callbacks = (error: any, data: LogData, key: string) => {
      cb && cb(error, data, key);
      this.callLogFnGlobalCallbacks(error, data, key);
    };

    this.db.save(matter)
      .then((data: any) => callbacks(null, matter, data))
      .catch((error: any) => callbacks(error, null, null));

    return true;
  }

  callLogFnGlobalCallbacks(error: any, matter: LogData, key: string) {
    const cbOnSave = this.on('save');
    const cbByLevel = this.on(matter.severity.toLowerCase());

    cbOnSave && cbOnSave(error, matter, key);
    cbByLevel && cbByLevel(error, matter, key);
  }

  explainLogLevel(levelKey: number | string): LogLevelExplained {
    if (typeof levelKey === 'string') {
      levelKey = this.resolveLogLevelFromStr(levelKey);
    }

    return {
      severity: this.logLevels[levelKey], 
      level: this.logLevels[levelKey] ? levelKey : DEFAULT_UNKNOWN_LOG_LEVEL
    }
  }

  resolveLogLevelFromStr(level: string): number {
    for(const [key, value] of Object.entries(this.logLevels)) {
      if (value.trim().toLowerCase() === level.trim().toLowerCase()) {
        return Number(key) || DEFAULT_UNKNOWN_LOG_LEVEL
      }
    }

    return DEFAULT_UNKNOWN_LOG_LEVEL;
  }

  on(cbName: string) {
    return this.options && this.options.on && this.options.on[cbName];
  }

  clear() {
    return this.db.clear();
  }

  getLogData() {
    return this.db.dump();
  }

  getLogTxt(download: boolean = true, fileNamePrefix: string) {
    return utils.dumpDBAsText(this.db, download, fileNamePrefix);
  }
}