type LogLevels = {
  [level: number]: string
}

type CallbackList = {
  [name: string]: Function
}

type LogLevelExplained = {
  level: number,
  severity: string,
}

type FrontPeekOptions = {
  save?: Function,
  dbName?: string,
  on?: CallbackList,
  customLogLevels?: LogLevels, 
}

type LogData = {
  tag?: string,
  date: string,
  level: number,
  payload: string,
  severity: string,
}

type DBOptions = {
  dbName: string
}