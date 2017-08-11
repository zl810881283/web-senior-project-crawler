const {user} = require("./config.json")

async function getXsrf(){
    let $1 = await rpap.get({
        url:"https://www.zhihu.com"
    })
    let xsrf = $1('input[name=_xsrf]').val()
    return xsrf
}
async function getCaptcha(){

}
async function login({phoneNum,password}) {


    console.log(xsrf)
    let res = await rpap.post({
        url:"https://www.zhihu.com/login/phone_num",
        method:"post",
        body:{
            _xsrf:xsrf,
            password:password,
            captcha_type:"cn",
            phone_num:phoneNum
        },
        json:true
    })
    console.log(res)
}

login(user)

module.exports = login