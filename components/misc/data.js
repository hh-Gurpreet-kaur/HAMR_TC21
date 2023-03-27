import React from 'react'
import {
  View,
  Text,
  StyleSheet
  , NativeModules
} from 'react-native'

// filesystem lib
import RNFS from 'react-native-fs'

// Sql library
import sql from 'react-native-sqlite-storage'
import color from '../../styles/colors'
const toast = NativeModules.ToastExample
sql.DEBUG(true)

export default class Work extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      sqlBuffer: []
    }
  }

  componentDidMount () {
    this.begin()
      .catch((err) => {
        console.log(err)
      })
  }

  async processBlock (contents, lastRead) {
    console.log('lastRead index : ' + lastRead)
    if (typeof contents === 'string') {
      while (contents.length > 0) {
        // get line
        let line = ''
        const n = contents.indexOf('\n')
        line = contents.slice(0, n)

        // if COMMENT
        const comment = (line[0] == '-' && line[1] == '-')
        if (comment) {
          // console.log('comment found, ignoring')

          // modify contents
          const end = contents.indexOf('\n')
          contents = contents.slice(end + 1, contents.length)

          // loop again
          continue
        }

        // if CREATE
        const create = line.indexOf('CREATE') == 0
        if (create) {
          // console.log('CREATE found!')

          // find end of command
          const createEnd = contents.indexOf(';')

          // if end not found, DANGER
          if (createEnd == -1) {
            throw 'CREATE end not found, block cut cmd in half maybe'
          }

          // get whole command
          const cmd = contents.slice(0, createEnd + 1)

          // modify contents
          contents = contents.slice(createEnd + 3, contents.length)

          // view final CREATE COMMAND
          // await this.singleQuery(cmd)

          continue
        }

        // if INSERT + REPEAT
        const insertAndRepeat = line.indexOf('INSERT') == 0
        if (insertAndRepeat) {
          console.log('INSERT + REPEAT FOUND')

          // find end
          let insertEnd = contents.indexOf('?)')
          const addCheck = contents[insertEnd + 3] == '\n'

          // end not found, DANGER
          if (insertEnd == -1) {
            throw 'INSERT end not found, block cut cmd in half maybe'
          }

          // addCheck 1 - newline after ?,?,)
          if (!addCheck) {
            throw 'might not be end of INSERT'
          }

          // fix end position
          insertEnd = insertEnd + 1

          // get whole cmd
          const insertCmd = contents.slice(0, insertEnd + 1)

          // await this.singleQuery(insertCmd)

          // modify contents
          contents = contents.slice(insertEnd + 3, contents.length)

          // waterfall check for REPEAT
          // 1. starts with REPEAT
          // 2. newline after '('
          const repeat = contents.indexOf('REPEAT (') == 0
          const repeatAddCheck = repeat && contents[9] == '\n'

          // insert + repeat surely found
          console.log(repeatAddCheck)
          if (repeatAddCheck) {
            console.log('REPEAT after INSERT found')

            let repeatCmd = ''

            // get lines till starts with ) and ends with newline
            // might need to ask for next line from read
            let i = 0
            while (1) {
              // GET LINE
              // REALLY IMP : do together in single block
              // get line + remove from contents
              const nend = contents.indexOf('\n')
              if (nend == -1) {
                // need more READ :(

                const path = RNFS.DocumentDirectoryPath + '/ex1.tmp'
                let readStart = lastRead + 1

                while (1) {
                  // read new line
                  line = await RNFS.read(path, 300, readStart, 'ascii')
                  const readEnd = line.indexOf('\n')
                  line = line.slice(0, readEnd)
                  readStart = readStart + readEnd + 1
                  // break

                  const lineLen = line.length
                  repeatEnd = line[line.length - 1] == '\n' && line[line.length - 2] == ')'
                  if (lineLen < 5) {
                    console.log(line)
                    console.log('length:' + lineLen)
                    console.log('last:' + line[lineLen - 1])
                    throw 'end?'
                  }

                  console.log(line)
                  // await this.singleQuery(line)
                  repeatCmd = repeatCmd + line
                }
                break
              }
              const repeatLine = contents.slice(0, nend + 1)
              contents = contents.slice(nend + 1, contents.length)

              // check if line was delimiter
              const lineLen = repeatLine.length
              repeatEnd = repeatLine[repeatLine.length - 1] == '\n' && repeatLine[repeatLine.length - 2] == ')'
              if (repeatEnd) {
                console.log('end?')
                console.log(repeatLine)
                break
              }

              console.log(++i + 'lines read')
              console.log(repeatLine.length)
              console.log(repeatLine)
              // repeatCmd = repeatCmd + repeatLine

              // this.getPortion(contents, nend)

              // ++i
              // if (i==8000) break
            }
          }

          break
        }

        // if UPDATE + REPEAT
        continue
      }
    }
  }

  getPortion (content, x) {
    if (typeof content === 'string') {
      console.log(content.substring(x - 150, x + 2))
    }
  }

  // entry point
  async begin () {
    // stakeholder vars
    let size = -1
    let block = 989990

    // get file location
    const testPath = RNFS.DocumentDirectoryPath + '/ex1.tmp'

    // get file size
    const res = await RNFS.stat(testPath)
    size = res.size
    // console.log(size)

    let start = 0
    block = size / 500

    const found = []
    let contents = ''

    // main file reading loop
    let i = 0
    const read = 0
    while ((start + block) <= size) {
      console.log(++i)

      // get content
      try {
        contents = await RNFS.read(testPath, block, start, 'ascii')
      } catch (err) {
        console.log(err)
      }

      // console.log(contents)

      // fix content
      const end = contents.lastIndexOf('\n')
      if (end != -1) {
        console.log('sliced file block')
        contents = contents.slice(0, end + 1)
        start = start + end + 1

        await this.processBlock(contents, end)
        // if (i==5) break
      } else {
        throw 'new line not found in file read block'
      }
    }
  }

  // seperates lines from sql buffer
  // and stores in the state
  process (contents) {
    if (typeof contents === 'string') {
      console.log('it is string')
      const buf = []

      while (contents.length > 0) {
        const pos = contents.search(';')
        const cmd = contents.substr(0, pos + 1)
        buf.push(cmd)
        contents = contents.substr(pos + 1)
        // console.log('singleton')
        // console.log(cmd)
        // console.log('rest of it')
        // console.log(stuff)
      }

      console.log('found all strings')

      // console.log('we got ' + buf.length +'thangs')
      // console.log(buf)

      sql.openDatabase('Home.db', '1.0', 'HH DB', 2000000, this.openCB, this.errorCB)
        .then((db) => {
          let index = 0
          while (buf.length > index) {
            this.singleQuery(db, buf[index])
            ++index
          }
        }).catch((err) => {
          console.log(err)
        })
    }
  }

  // the golden egg
  // dbO => promise returned from openDatabase()
  async singleQuery (q) {
    const db = await sql.openDatabase('Home.db', '1.0', 'HH DB', 2000000, this.openCB, this.errorCB)
    try {
      await db.executeSql(q)
      return
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  startDatabaseCreation (contents) {
    sql.echoTest()
      .then(() => {
        sql.openDatabase('test.db', '1.0', 'HH DB', 2000000, this.openCB, this.errorCB)
          .then((db) => {
            db.executeSql(contents)
              .then(() => {
                console.log('device!')
              }).catch((err2) => {
                console.log(err2)
              })
          }).catch((err) => {
            console.log('open db error')
            console.log(err)
          })
      }).catch((echoE) => {
        console.log('echo test error')
        console.log(echoE)
      })
  }

  openCB () {
    console.log('db open')
  }

  errorCB (err) {
    console.log('error')
    console.log(err)
  }

  render () {
    return (
			<View style={style.box}>
				<Text style={style.text}>
					100
				</Text>
			</View>
    )
  }
}

const style = StyleSheet.create({
  box: {
    backgroundColor: color.grey,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  text: {
    fontSize: 25
  }
})
