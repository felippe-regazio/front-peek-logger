import FrontPeekDB from './db'
import utils from './utils'

import {
  DEFAULT_LOG_LEVELS,
  DEFAULT_DATABASE_NAME,
  DEFAULT_UNKNOWN_LOG_LEVEL
} from './constants'

export default class FrontPeekLogger {
  db: any;
  disabled: boolean = false;
  options: FrontPeekOptions;
  logLevels: LogLevels = { ...DEFAULT_LOG_LEVELS };

  constructor(options: FrontPeekOptions = {}) {
    const dbName = options.dbName || DEFAULT_DATABASE_NAME;

    try {
      this.options = options || {};
      this.registerLogLevels();
      
      this.db = new FrontPeekDB({
        dbName,
        maxRecords: options.maxRecords
      });
    } catch(error) {
      console.error(error);
      this.disabled = true;
    }
  }

  registerLogLevels() {
    const _log = this.log.bind(this);

    for(const [ level, severity ] of Object.entries(this.logLevels)) {
      _log[severity.toLowerCase()] = (message: string, cb?: Function) => {
        return _log(Number(level), message, cb);
      }
    }

    this.log = _log;
  }

  log(level: number | string, payload: string, cb?: Function) {
    if (this.disabled || !payload) {
      return false;
    }

    if (typeof payload !== 'string') {
      console.warn('Front Peek tried to store a non string value: ', payload);
      
      try {
        payload = JSON.stringify(payload);
      } catch(error) {
        return false;
      }
    }

    const date = String(new Date());
    const levelInfo = this.explainLogLevel(level);
    const matter: LogData = { ...levelInfo, payload, date, times: 1 };
    
    const callbacks = (error: any, key: string, log: LogData,) => {
      const cbData = { error, key, log };

      this.instanceGlobalCallbacks(cbData);
      cb && cb(cbData);
    };

    this.db.save(matter)
      .then((logKey: any) => callbacks(null, logKey, matter))
      .catch((error: any) => callbacks(error, null, null));

    return true;
  }

  instanceGlobalCallbacks(data: { error: any, key: string|number, log: LogData }) {
    const cbOnSave = this.on('save');
    const cbByLevel = this.on(data.log.severity.toLowerCase());

    cbOnSave && cbOnSave(data);
    cbByLevel && cbByLevel(data);
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