import FrontPeekDB from './db'
import utils from './utils'

import {
  DEFAULT_LOG_LEVELS,
  DEFAULT_DATABASE_NAME,
  DEFAULT_DB_MAX_RECORDS,
  DEFAULT_UNKNOWN_LOG_LEVEL
} from './constants'

module.exports = class FrontPeekLogger {
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
      this.log[severity.toLowerCase()] = (message: string) => {
        this.log(Number(level), message);
      }
    }
  }

  log(level: number | string, payload: string) {
    return new Promise((resolve, reject) => {
      if (this.disabled || !payload) {
        reject(false);
      }
  
      if (typeof payload !== 'string') {
        console.warn('Front Peek log skipped: Tried to store a non string value:');
        console.trace(payload);
  
        reject(false);
      }
  
      const date = String(new Date());
      const levelInfo = this.explainLogLevel(level);
      const matter: LogData = { ...levelInfo, payload, date, times: 1 };
      const callbackByLevel = this.on(levelInfo.severity.toLowerCase());
      
      this.save(matter);
      callbackByLevel && callbackByLevel(matter);
      resolve(true);
    })
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

  save(matter: LogData) {
    this.options.save ? this.options.save(matter) : this.db.save(matter)
    const saveCallback = this.on('save');
    saveCallback && saveCallback(matter);
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