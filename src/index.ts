import FrontPeekDB from './db'
import utils from './utils'

import {
  DEFAULT_LOG_LEVELS,
  DEFAULT_DATABASE_NAME,
  DEFAULT_UNKNOWN_LOG_LEVEL
} from './constants'

module.exports = class FrontPeekLogger {
  db: any;
  disabled: boolean = false;
  options: FrontPeekOptions;
  logLevels: LogLevels = { ...DEFAULT_LOG_LEVELS };

  constructor(options: FrontPeekOptions = {}) {    
    try {
      this.options = options || {};
      this.registerLogLevels();
      this.db = new FrontPeekDB({ dbName: options.dbName || DEFAULT_DATABASE_NAME });
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
    const matter: LogData = { ...levelInfo, payload, date };
    const callbackByLevel = this.on(levelInfo.severity.toLowerCase());
    
    this.save(matter);
    callbackByLevel && callbackByLevel(matter);
    return true;
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
    this.options.save ? this.options.save(matter) : this.db.save(matter);

    const saveCallback = this.on('save');
    saveCallback && saveCallback(matter);
  }

  getLogText(download: boolean = true, fileNamePrefix: string) {
    utils.dumpDBAsText(this.db, download, fileNamePrefix);
  }

  getLogData() {
    return this.db.dump();
  }  
}