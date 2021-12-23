import 'fake-indexeddb/auto'
import FrontPeekLogger from '../dist'
import { DEFAULT_LOG_LEVELS } from '../src/constants'

const FPL = new FrontPeekLogger();
beforeAll(() => FPL.clear());

describe('Test common usage', () => {
  test('Test: Log Fn | Log Levels (number index, string index) | getLogData fn', done => {
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
});