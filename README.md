# Front Peek Logger

Front Peek is a Client-Only Persistent Logger, it helps you to store application state and activity logs directly on the client and retrieve this logs later to analysis and debug. This mitigates the needing of a robust backend platform to receive and process all the client activity, since all the data is decentralized and stored on client itself. Note: this is a `Debug Tool`, very similar to when your Operational System collects data about a crash or usabillity and suggests you to send them to the responsible team; this is NOT a tracker, health checker, observability or live activity analysis tool.

# Considerations

This library is in "pause state" since it cant deliver a good reliability and consistense on generated logs. This is due the current browser IndexedDB implementations issue (specially on chrome), which is very slow and still have some bugs. When doing tests stressing the IndexedDB with +5K writing transactions at once, some inconsistences may appear, which is intolarable on a log application because we couldnt trust on the log iteself. Many effords and techiniques where applied in order to mitigate the IndexedDB performance problemas as: using the db storage as a fixed size LIFO, implementation an async garbage collecttor on the lib to keep the DB payloads small, used less queries as possible, etc. but none of them made stress tests perform better. Since indexedDB is for a while the only option for unlimited persistent storage on browsers, this library is paused till we have a better implementation or some lightweight alternative.

Some further readings about:

Why IndexedDB is slow and what to use instead
https://rxdb.info/slow-indexeddb.html

Chrome’s IndexedDB— from best in class to the slowest
https://dfahlander.medium.com/chromes-indexeddb-from-best-in-class-to-the-slowest-d34ed14624e0
