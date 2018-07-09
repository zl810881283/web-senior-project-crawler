const Promise = require("bluebird")
const retry = require('bluebird-retry');

const rpap = require("./rpap.js")
const htmlDecode = require("./htmlDecode.js")
const MongoClient = require('mongodb').MongoClient
const Tesseract = require('tesseract.js')

const step = 10
const gap = 1000 //ms

const start = 21165391
const end = 30000000
function* range(start, end) {
    for (let i = start; i < end; i++) {
        yield i
    }
}
async function main() {
    let url = 'mongodb://localhost:27017/zhihu-data';
    let db = await MongoClient.connect(url)
    await Promise.map(
        [...range(start, end)],
        async i => {
            try {
                await retry(async () => {
                    let questions = await db.collection('questions').findOne({id:i})
                    if (questions) {
                        console.log(`question id: ${i} already exists, skip`)
                    } else {
                        try {
                            await Promise.resolve(getQuestion(db, i)).timeout(20000)
                        } catch (err) {
                            if (err.name == 'StatusCodeError')
                                return console.log(`question id: ${i} StatusCodeError is ${err.statusCode}`)

                            console.log(`question id: ${i} error occur, ${err.name}, retry......`)
                            throw err
                        }
                    }
                }, { max_tries: 10, interval: 2000 })
            } catch (err) {
                console.log(`question id: ${i} retry fail, drop`)
            }
        },
        { concurrency: 50 }
    )
}
async function getQuestion(db, id) {
    let $ = await rpap.get({
        url: `https://www.zhihu.com/question/${id}`,
    })
    let json = htmlDecode($("#data").attr("data-state"))
    let state = JSON.parse(json)
    let question = state.entities.questions[id]
    let answerCount = question.answerCount
    await db.collection('questions').insert(question)
    await getQuestionAnswers(db, id, answerCount)
    console.log(`question id: ${question.id} inserted into mongodb`)
}
async function getQuestionAnswers(db, id, answerCount) {
    for (let offset = 0; offset < answerCount; offset += 10) {
        let url = `https://www.zhihu.com/api/v4/questions/${id}/answers?include=data%5B*%5D.is_normal%2Creward_info%2Cis_collapsed%2Cannotation_action%2Cannotation_detail%2Ccollapse_reason%2Cis_sticky%2Ccollapsed_by%2Csuggest_edit%2Ccomment_count%2Ccan_comment%2Ccontent%2Ceditable_content%2Cvoteup_count%2Creshipment_settings%2Ccomment_permission%2Cmark_infos%2Ccreated_time%2Cupdated_time%2Creview_info%2Crelationship.is_authorized%2Cis_author%2Cvoting%2Cis_thanked%2Cis_nothelp%2Cupvoted_followees%3Bdata%5B*%5D.author.follower_count%2Cbadge%5B%3F(type%3Dbest_answerer)%5D.topics&offset=${offset}&limit=10&sort_by=default`
        let json = await rpap.get({
            url,
            headers: {
                authorization: 'oauth c3cef7c66a1843f8b3a9e6a1e3160e20'
            }

        })
        let answers = json.data
        await db.collection('answers').insertMany(answers)
        //console.log(JSON.stringify(json,null,2))

    }


}
main().catch(err => console.log(err))