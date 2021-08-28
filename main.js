//#region modules for electron
const electron = require('electron')
const path = require('path')
const {app, BrowserWindow,ipcMain} = electron
app.allowRendererProcessReuse = true
var mainWindow
//#endregion

//#region modules for QRCode Generation
const QRCode = require('qrcode')
const ip = require("ip")
//#endregion

//#region modules for remote control
const robot = require('robotjs')
const {Howl,Howler} = require('howler')

//#endregion

//#region modules for Socket.io
const port = 7080
const socketIO = require('socket.io')
const ioAuth = require('socketio-auth')
var pwd = "default"
//#endregion

//#region modules for layout Reading
const fs = require("fs")
const layout = require("./test.json")

function readLayout(){

}
//#endregion

//#region io
var io = socketIO(port,{pingTimeout:1000,pingInterval:1000})

var clientCount = io.engine.clientsCount

console.log(ip.address())

console.log(clientCount)
if(clientCount > 0){
    mainWindow.webContents.send('connect')
}

function initIo(){

    //init auth
    ioAuth(io,{
        authenticate: (socket,data,callback)=>{
            var password = data.password
            console.log(password)
            return callback(null,password == pwd)
        },
        disconnect: ()=>{
            console.log("disconnected")
        },
        timeout:100
    })

    io.on('connection', socket => {
        mainWindow.webContents.send('stat',"😎 Connected!",'connect')
        clientCount ++
        console.log(clientCount)
        if(clientCount > 0){
            mainWindow.webContents.send('connect')
        }

        socket.on('disconnect', ()=>{
            mainWindow.webContents.send('stat',"🙁 Disconnected!",'disconnect')
            clientCount --
            console.log(clientCount)
            if(clientCount<=0){
                mainWindow.webContents.send('disconnect')
            }
        })
    
        socket.on("ktd",(arg)=>{
            mainWindow.webContents.send('stat',"👉⌨️ "+ arg,"click")
            robot.keyToggle(arg,"down")
        })
        socket.on("ktu",(arg)=>{
            mainWindow.webContents.send('stat',"👆⌨️ "+ arg,"clickoff")
            robot.keyToggle(arg,"up")
        })
        socket.on("ktap",(arg)=>{
            mainWindow.webContents.send('stat',"💥⌨️ "+ arg,"click")
            robot.keyTap(arg)
        })

        socket.on("orientation",(arg) => {
            console.log(arg)
        })
        
        socket.on("test",()=>{
            console.log("ping!")
            mainWindow.webContents.send('stat',"ping!")
        })

        socket.on("getlayout",()=>{
            socket.emit("layout",layout)
        })

        
    })
}

initIo()
//#endregion






//#region ipcMain Listeners

//power button control
ipcMain.on('pwr',(event,arg) => {
    if(arg){
        io = socketIO(port,{pingTimeout:1000,pingInterval:1000})
        initIo()
        clientCount = io.engine.clientsCount
        mainWindow.webContents.send('stat',"😀 Sokket Activated!","on")
    } else {
        io.emit("shutdown")
        mainWindow.webContents.send('stat',"😌 Deactivating...","off")
        mainWindow.webContents.send('shutdownStart')
        io.close(()=>{
            mainWindow.webContents.send('shutdownEnd')
            mainWindow.webContents.send('stat',"😴 Sokket Deactivated!")
            console.log(clientCount)
        })
    }
})

//set QRcode
ipcMain.on('setQRCode', (event,arg) => {
    if(!arg){
        mainWindow.webContents.send('stat',"🙄 QR Code Reloaded!",'update')
    }
    QRCode.toDataURL("http://"+ip.address()+":"+port,(err,url)=>{
        event.returnValue = url
    })  
})

//set Password
ipcMain.on("pwdset",(event,arg)=>{
    console.log(arg)
    mainWindow.webContents.send('stat',"🔑 Restart to apply new password!",'update')
    pwd = arg
})

//#endregion

//#region App stuff
app.on('ready',()=>{
    //Create new Window
    mainWindow = new BrowserWindow({
        width:300,
        height:400,
        resizable:false,
        frame:false,
        transparent:true,
        alwaysOnTop:true,
        darkTheme:true,
        fullscreenable: false,
        maximizable: false,
        webPreferences: {
        nodeIntegration: true,
      }})
    mainWindow.loadFile(path.join(__dirname,'mainWindow.html'))
    mainWindow.on('close',()=>{
        io.emit("shutdown")
        io.close()
        console.log("CLOSING")
    })
})

app.on('window-all-closed', () => {
    app.quit()
})
//#endregion