export default {
  dumpDBAsText(db: any, download: boolean = true, fileNamePrefix: string) {
    return new Promise((resolve, reject) => {
      db.dump().then(data => {
        const txt = this.dbDataToText(data);
        const fileName = this.randomFileName(fileNamePrefix);
        download && this.downloadStrAsFile(fileName, txt);
        resolve(txt);
      })
        .catch(reject);
    });
  },

  dbDataToText(data: any) {
    return data && data
      .map(item => `${item.severity.toUpperCase()} : ${item.date} x${item.times}\n\n${item.payload}`)
      .join(`\n${'-'.repeat(80)}\n`);
  },

  downloadStrAsFile(filename: string, content: string) {
    const fileName = `${filename}.log`;
    const blob = new Blob([ content ], { type: 'text/plain' });

    const a = Object.assign(document.createElement('a'), {
      download: fileName,
      href: URL.createObjectURL(blob),
    });

    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); }, 1000);
  },  

  randomFileName(prefix: string) {
    return `${prefix ? `${prefix}-` : ''}${Date.now()}`;
  }
}