import {readFileSync,writeFileSync,renameSync} from 'node:fs'
import {validateStudySnapshot,type StudySnapshot} from '../src/lib/itStudy.ts'
const path=process.argv[2]
if(!path)throw new Error('Usage: npm run import:study -- /path/to/study-index.json')
const snapshot=validateStudySnapshot(JSON.parse(readFileSync(path,'utf8')) as StudySnapshot)
const target=new URL('../src/data/it-study-snapshot.json',import.meta.url),temp=new URL('../src/data/.it-study-snapshot.tmp',import.meta.url)
writeFileSync(temp,JSON.stringify(snapshot)+'\n');renameSync(temp,target)
console.log(`Imported source ${snapshot.sourceCommit}: ${snapshot.totalDays} reports through ${snapshot.lastDate}`)
