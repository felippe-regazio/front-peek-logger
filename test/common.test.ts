import 'fake-indexeddb/auto'
import FrontPeekLogger from '../dist'
import { DEFAULT_LOG_LEVELS } from '../src/constants'

const FPL = new FrontPeekLogger();
beforeEach(() => FPL.clear());

describe('Test public methods and common usage', () => {
  test('Check log method + different log levels | Check getLogData', done => {
    [ 'keys', 'values' ].forEach(entry => {
      Object[entry](DEFAULT_LOG_LEVELS).forEach((level: number|string) => {
        FPL.log(Number(level) || level, `Log using log level: "${level}"`);
      });
    });

    setTimeout(async () => {
      const data = await FPL.getLogData();

      expect(data.length).toEqual(Object.keys(DEFAULT_LOG_LEVELS).length * 2);

      Object.values(DEFAULT_LOG_LEVELS).forEach(severity => {
        const severityWasLogged = data.some(item => item.severity === severity);
        const messageBySeverityIsOk = data.some(item => item.payload === `Log using log level: "${severity}"`);

        expect(severityWasLogged).toBeTruthy();
        expect(messageBySeverityIsOk).toBeTruthy();
      });

      Object.keys(DEFAULT_LOG_LEVELS).forEach(severityIndex => {
        const severityWasLogged = data.some(item => item.level === Number(severityIndex));
        const messageBySeverityIsOk = data.some(item => item.payload === `Log using log level: "${severityIndex}"`);

        expect(severityWasLogged).toBeTruthy();
        expect(messageBySeverityIsOk).toBeTruthy();
      });

      done();
    }, 1000);
  });

  test('Check log method callback', done => {
    FPL.log('info', 'Hello world', cbData => {
      expect(typeof cbData).toEqual('object');
      expect(cbData.error).toBeNull();
      expect(Object.keys(cbData).length > 0).toBeTruthy();
      expect(Object.keys(cbData.log).length).toBeTruthy();
      expect(new Date(cbData.log.date)).toBeTruthy();

      const mockCbData = {
        times: 1,
        level: 3,
        severity: 'Info',
        payload: 'Hello world'
      };

      Object.keys(mockCbData).forEach(key => {
        expect(cbData.log[key]).toEqual(mockCbData[key]);
      });

      done();
    });
  });

  test('Check Log levels shortcut methods', done => {
    const callbacksFired = [];

    Object.values(DEFAULT_LOG_LEVELS).forEach((level: any) => {
      FPL.log[level.toLowerCase()](`${level} Shortcut Ok`, () => {
        callbacksFired.push(level);
      });
    });

    setTimeout(async () => {
      const data = await FPL.getLogData();

      Object.values(DEFAULT_LOG_LEVELS).forEach(level => {
        const severityWasLogged = data.some(item => item.severity === level);
        const messageBySeverityIsOk = data.some(item => item.payload === `${level} Shortcut Ok`);

        expect(severityWasLogged).toBeTruthy();
        expect(messageBySeverityIsOk).toBeTruthy();
        expect(callbacksFired.some(item => item === level)).toBeTruthy();
      });

      done();
    }, 1000);
  });

  test('Check clear() method', done => {
    for(let i=0; i < 100; i++) {
      FPL.log('info', String(i));
    }

    setTimeout(() => {
      FPL.clear()
        .then(async () => {
          const data = await FPL.getLogData();

          expect(data.length).toBeFalsy();
          done();
        })
        .catch(error => {
          throw error;
        });
    }, 1000);
  });

  test('Check downloaded log content', done => {
    FPL.log('info', 'LOG TXT CONTENT TEST', async cbData => {
      const logText = await FPL.getLogTxt(false);
      expect(logText.includes(cbData.log.payload)).toBeTruthy();
      done();
    });
  });
});