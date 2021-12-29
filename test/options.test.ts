import FrontPeekLogger from '../dist'
import { DEFAULT_LOG_LEVELS } from '../src/constants'

/**
 * Tests different instances with different available
 * options. Must have tested all options at the end.
 */
describe('Test FPL instance independency', () => {
  test('Check dbName option', done => {
    const FPL_A = new FrontPeekLogger({
      dbName: 'fizz',
    });

    const FPL_B = new FrontPeekLogger({
      dbName: 'buzz',
    });

    FPL_A.log.info('Fizz', () => {
      FPL_B.log.info('Buzz', async () => {
        const dataA = await FPL_A.getLogData();
        const dataB = await FPL_B.getLogData();

        expect(dataA.length).toEqual(1);
        expect(dataB.length).toEqual(1);

        done();
      });
    });
  });

  test('Global callbacks: { on: { save, ...logLevels} }', done => {
    const runnedCallbacks = [];
    const promises = [];
    
    const options = {
      on: {
        save: () => runnedCallbacks.push('save')
      }
    };

    Object.values(DEFAULT_LOG_LEVELS).forEach((logLevel: any) => {
      options.on[logLevel.toLowerCase()] = () => runnedCallbacks.push(logLevel.toLowerCase());
    });

    const FPL = new FrontPeekLogger(options);

    Object.values(DEFAULT_LOG_LEVELS).forEach((logLevel: any) => {
      promises.push(new Promise(resolve => {
        FPL.log[logLevel.toLowerCase()]('Testing', () => {
          expect(runnedCallbacks.some(item => item === logLevel.toLowerCase())).toBeTruthy();

          resolve(true);
        });
      }));
    });

    Promise.all(promises).then(() => {
      expect(runnedCallbacks.filter(item => item === 'save').length).toEqual(Object.keys(DEFAULT_LOG_LEVELS).length);
 
      done()
    });
  });

  test('Max records', done => {
    const FPL = new FrontPeekLogger({
      maxRecords: 2000
    });

    for(let i=0; i < 2500; i++) {
      FPL.log.info(`Testing ${i}`);
    }

    FPL.db.garbageCollector().then(async () => {
      const data = await FPL.getLogData();
      expect(data.length).toEqual(2000);
      expect(data[1999].payload).toEqual('Testing 2500');

      done();
    });
  });
});