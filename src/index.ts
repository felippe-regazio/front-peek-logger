import FrontPeekDB from './db'
import { DEFAULT_LOG_LEVELS, DEFAULT_UNKNOWN_LOG_LEVEL } from './constants'

module.exports = class FrontPeekLogger {
  db: any;
  on: CallbackList = {};
  options: FrontPeekOptions = {};
  logLevels: LogLevels = { ...DEFAULT_LOG_LEVELS };

  constructor(options: FrontPeekOptions = {}) {
    this.options = options;
    this.db = new FrontPeekDB({ dbName: options.dbName || 'frontpeek-db' });

    this.registerHooks(options.on);
    this.registerLogLevels(options.customLogLevels);
  }
  
  registerHooks(cbl: CallbackList) {
    this.on = cbl || {};
  }
  
  registerLogLevels(customLogLevels: LogLevels = {}) {
    this.logLevels = { ...customLogLevels, ...this.logLevels }
  }

  log(level: number | string, payload: string, tag: string = 'FrontPeekLog') {    
    if (typeof payload !== 'string') {
      try {
        payload = JSON.stringify(payload);
      } catch(e) {
        console.error(`Error while stringifying Front Peek Log payload:\n\n`, e);
      }
    }

    const date = String(new Date());
    const levelInfo = this.explainLogLevel(level);
    
    const matter: LogData = { ...levelInfo, payload, tag, date };
    const callback = this.on[levelInfo.severity.toLowerCase()];

    this.save(matter);
    callback && callback(matter);
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

  save(matter: LogData) {
    this.options.save ? 
      this.options.save(matter) : 
      this.db.save(matter);

    this.on.save && this.on.save(matter);
  }

  getLog() {
    return this.db.dump();
  }

  downloadLogTxt(namePrefix: string) {
    return new Promise((resolve, reject) => {
      this.getLog().then(data => {
        const fileName = `${namePrefix ? `${namePrefix}-` : ''}${Date.now()}`;

        const txt = data
          .map(item => {
            return `${item.severity.toUpperCase()} : ${item.date}\nTag: ${item.tag}\n\n${item.payload}`;
          })
          .join(`\n${'-'.repeat(80)}\n`);

        this.downloadStrAsFile(fileName, txt);
        resolve(data);
      })
        .catch(reject);
    });
  }

  downloadStrAsFile(filename: string, content: string) {
    const fileName = `${filename}.log`;
    const blob = new Blob([ content ], { type: 'text/plain' });

    const a = Object.assign(document.createElement('a'), {
      download: fileName,
      href: URL.createObjectURL(blob),
    });

    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); }, 1000);
  }  
}