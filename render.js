const {ipcRenderer,remote} = require('electron')
const qrLoadBtn = document.getElementById('qrLoadBtn')
const qrCanvas = document.getElementById('qrcode')
const pwrBtn = document.getElementById('pwrBtn')
const mainBody = document.getElementById('main')
const statText = document.getElementById('statText')
const pwdForm = document.getElementById('password')

const exitBtn = document.getElementById('exit')
const minBtn = document.getElementById('minimize')
const muteBtn = document.getElementById('muter')
const unmuteBtn = document.getElementById('unmuter')
const sound = new Howl({
    src:['./assets/sfx/sfx.mp3'],
    sprite:{
        "start": [
          0,
          2589.0702947845803
        ],
        "click": [
          4000,
          13.083900226757095
        ],
        "clickoff": [
          6000,
          80.40816326530643
        ],
        "connect": [
          8000,
          1655.2154195011344
        ],
        "disconnect": [
          11000,
          1875.5328798185947
        ],
        "on": [
          14000,
          1735.1020408163258
        ],
        "off": [
          17000,
          1740.7482993197264
        ],
        "update": [
          20000,
          1953.8548752834472
        ]
    }
})


qrLoadBtn.onclick = loadQRCode
pwrBtn.onclick = ToggleOnOff
exitBtn.onclick = exit
minBtn.onclick = minimize
muteBtn.onclick = toggleMute
unmuteBtn.onclick = toggleMute

var muted = false

unmuteBtn.hidden = !muted
muteBtn.hidden = muted


if(!muted){sound.play("start")}

var isFirstLoad = true
loadQRCode()

function loadQRCode(){

    var ns = new Howl({src:['./asasets/sfx/a.wav']})
    ns.play()
    var img = new Image
    img.onload = () => {
        ctx = qrCanvas.getContext('2d')
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img,0,0,img.width,img.height,
            0, 0, qrCanvas.width, qrCanvas.height)
        
        let imgd = ctx.getImageData(0,0,qrCanvas.width,qrCanvas.height)
        let pix = imgd.data
        let newColor = {r:0,g:0,b:0,a:0}

        for (var i = 0, n = pix.length;i<n;i += 4){
            if(pix[i] == 255 && pix[i+1] == 255 && pix[i+2] == 255){
                pix[i] = 0
                pix[i+1] = 0
                pix[i+2] = 0
                pix[i+3] = 0
            }
        }
        ctx.putImageData(imgd,0,0)
        console.log("done!")
    }
    img.src = ipcRenderer.sendSync('setQRCode',isFirstLoad)
    isFirstLoad = false

    
}

function ToggleOnOff(){
    var current = pwrBtn.getAttribute("state")
    if(current == 'On'){
        ipcRenderer.send('pwr',false)
    } else {
        pwrBtn.setAttribute("state","On")
        pwrBtn.setAttribute("class","button is-success")
        ipcRenderer.send('pwr',true)
    }

}

function exit(){
    var window = remote.getCurrentWindow()
    window.close()
}

function minimize(){
    var window = remote.getCurrentWindow()
    window.minimize()

}

function toggleMute(){
    muted = !muted
    unmuteBtn.hidden = !muted
    muteBtn.hidden = muted
}

pwdForm.addEventListener('submit',(evt) =>{
    evt.preventDefault()
    ipcRenderer.send('pwdset',evt.target[0].value)

    console.log(evt.target[0].value)
    evt.target[0].value = ''
})


ipcRenderer.on('stat',(evt,arg,sfx)=>{
    if(sfx != undefined && !muted){
        sound.play(sfx)
    }
    statText.innerHTML = arg
    statText.style.animation = 'none'
    setTimeout(()=>{statText.style.animation = ''},100)
})

ipcRenderer.on('connect',()=>{
    mainBody.setAttribute('class',"onBackground")
})

ipcRenderer.on('disconnect',()=>{
    mainBody.setAttribute('class',"offBackground")
    
})

ipcRenderer.on('shutdownStart',()=>{
    pwrBtn.setAttribute("state","Off")

    pwrBtn.setAttribute("class","button is-danger is-loading")
    pwrBtn.setAttribute("disabled",'')
    
})
ipcRenderer.on('shutdownEnd',()=>{
    pwrBtn.setAttribute("class","button is-danger")
    pwrBtn.removeAttribute("disabled")
})