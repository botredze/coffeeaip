const express = require("express");
const {createServer} = require("http");
const bodyParser = require("express");
const {Server} = require("socket.io");
const cors = require("cors");
const app = express();
app.use(bodyParser.json())
const port = 3000;
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

httpServer.listen(port, "localhost", () => {
    console.log(`Сервер запушен на ${port}`)
});


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.js')
})

app.use(bodyParser.json())
app.use(cors({
    origin: '*'
}));

const queueList = []

let users = [
    {id: 1, login: 'dsalabaev', password: 'qwerty', first_name: 'Dastan', email: 'dastan@gmail.com', last_name: 'Salabaev'},
    {id: 1, login: 'qwerty', password: 'qwerty', first_name: 'Bratan', email: 'dastan@gmail.com', last_name: 'Chuvakovich'}
]

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.js')
})

app.post('/login', (req, res) => {

    const {login, password} = req.body
    if(!login || !password){
        return res.status(400).setHeader('content-type', 'application/json').send({
            success: false, message: 'Введите логин и пароль'
        })
    }
    const user = users.find((user) => {
        return user.login === login & user.password === password
    })
    if(!user){
        return res.status(400).setHeader('content-type', 'application/json').send({
            success: false, message: 'Неверный логин или пароль'
        })


    }
    return res.status(200).setHeader('content-type', 'application/json').send({
        success: true, message: 'ОК', data: user
    })

});

let identify = 3

app.post('/register', (req, res) => {
    const {login, password, first_name, last_name,email} = req.body

    if (!login || !password || !first_name || !last_name || !email) {
        return res.status(204).setHeader('content-type', 'application/json').send({
            success: false,
            message: 'Заполните все поля'
        })
    }

    const user = users.find((user) => {
        return user.login === login
    })

    if (user) {
        return res.status(401).setHeader('content-type', 'application/json').send({
            success: false,
            message: 'Пользователь с таким логином уже существует'
        })
    }
    const newUser = {
        id: identify++,
        login,
        password,
        first_name,
        last_name,
        email,

    }
    users.push(newUser)

    console.log(newUser)

    return res.status(200).setHeader('content-type', 'application/json').send({
        success: true,
        message: 'ОК',
        data: newUser
    })
})


// Очередь socket.io

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const user =  queueList.find((user) => {
            return data.user === user.user
        })


        if(user){
            socket.emit('join-error', {
                message: 'Пользователь уже в очереди',
            })

            return;
        }
        socket.emit('join', {
            user: data.user,
            department: data.department,
            status: data.status,
            addTime: new Date().toTimeString(),

            message: "Пользователь добавлен в очередь"
        })
        queueList.push(data)
        console.log(data)

    })

    socket.on('in-process', (data) => {

        const queue = queueList.find((queue) => {
            return data.user === queue.user & data.status === queue.status
        })

        if(!queue){
            socket.emit('user-notfound', {
                message: 'Пользователь в очереди не найден'
            })
        }
        const index  = queueList.indexOf(queue)
        if(index <= 1 ){
            if(queue) {
                queueList.pop()
                socket.emit('success', {
                    message: 'User out',
                    user: this.user
                })
            }
        } else {
            socket.emit('error-out', {
             message: "Ожидайте свою очередь"
            })
        }


        console.log(data)
        console.log(queue)
    })

})

io.on('disconnect', (socket) => {
    socket.on('get-out', (data) => {
        if(data.user === queueList.user){
            queueList.delete(data)        }
        socket.emit('get-out', {
            user: data.user,
            status: 'Отменен',
            message: 'Пользователь вышел из очереди'
        })
    })


})




    // function theTime () {
    //     const ctx = this;
    //
    //     const x = setInterval(() => {
    //         const countDownDate = new Date().getTime()
    //         const now = new Date().getTime()
    //         const diff = countDownDate - now
    //
    //         const tminutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60))
    //         const tseconds = Math.floor(diff % (1000 * 60) / 1000)
    //
    //         ctx.seconds = (tseconds < 10) ? '0' + tseconds : tseconds
    //         ctx.minutes = (tminutes < 10) ? '0' + tminutes : tminutes
    //
    //         if (diff < 0) {
    //             clearInterval(x)
    //             ctx.expired  = true
    //         }
    //     }, 1000)
    //
    //     return {
    //         seconds: ctx.seconds,
    //         minutes: ctx.minutes
    //     }
    // }




