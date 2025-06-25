import { TELEGRAM_CONFIG } from './env.js';

function startKeepAlive() {
    const interval = 5 * 60 * 1000; // 5 分鐘

    setInterval(() => {
        const msg = "⏰ 搶票機器人仍在運行中（每5分鐘狀態通知）";

        fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.bot1.token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CONFIG.bot1.chat_id,
                text: msg
            })
        }).then(() => console.log("✅ 定時通知已送出"))
          .catch(err => console.error("❌ 定時通知失敗", err));
    }, interval);
}

async function sleep(t) {
    return await new Promise(resolve => setTimeout(resolve, t));
}

function theFrame() {
    if (window._theFrameInstance == null) {
      window._theFrameInstance = document.getElementById('oneStopFrame').contentWindow;
    }
  
    return window._theFrameInstance;
}

function getConcertId() {
    return document.getElementById("prodId").value;
}

function openEverySection() {
    let frame = theFrame();
    let section = frame.document.getElementsByClassName("seat_name");
    console.log(section);
    for (let i = 0; i < section.length; i++) {
        section[i].parentElement.click();
    }
}

async function clickOnArea(area) {
    let frame = theFrame();
    let section = frame.document.getElementsByClassName("area_tit");
    for (let i = 0; i < section.length; i++) {
        let reg = new RegExp(area + "\$","g");
        if (section[i].innerHTML.match(reg)) {
            section[i].parentElement.click();
            
            // ✅ 在這裡加入隨機 delay
            const delay = 2000 + Math.random() * 1000; // 2.0 ~ 3.0 秒
            await sleep(delay);

            return;
        }
    }
}

async function findSeatA() {
    let frame = theFrame();
    let canvas = frame.document.getElementById("ez_canvas");
    let seat = canvas.getElementsByTagName("rect");
    console.log(seat);
    await sleep(750);
    for (let i = 0; i < seat.length; i++) {
        let fillColor = seat[i].getAttribute("fill");
    
        // Check if fill color is different from #DDDDDD or none
        if (fillColor !== "#DDDDDD" && fillColor !== "none") {
            console.log("Rect with different fill color found:", seat[i]);
            var clickEvent = new Event('click', { bubbles: true });

            seat[i].dispatchEvent(clickEvent);
            frame.document.getElementById("nextTicketSelection").click();
            return true;
        }
    }
    return false;
}

async function findSeat() {
    let frame = theFrame();
    let canvas = frame.document.getElementById("ez_canvas");
    let seat = canvas.getElementsByTagName("rect");
    console.log(seat);
    await sleep(750);
    
    for (let i = 0; i < seat.length; i++) {
        let fillColor = seat[i].getAttribute("fill");

        if (fillColor !== "#DDDDDD" && fillColor !== "none") {
            console.log("Rect with different fill color found:", seat[i]);

            // 點擊座位與下一步
            var clickEvent = new Event('click', { bubbles: true });
            seat[i].dispatchEvent(clickEvent);
            frame.document.getElementById("nextTicketSelection").click();

            // ✅ 傳送 Telegram 通知
            const msg = "🎉 成功點擊座位並進入下一步！";

            // Bot 1
            fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.bot1.token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.bot1.chat_id,
                    text: msg
                })
            });

            // Bot 2
            fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.bot2.token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.bot2.chat_id,
                    text: msg
                })
            });

            return true;
        }
    }
    return false;
}


async function checkCaptchaFinish() {
    if (document.getElementById("certification").style.display != "none") {
        await sleep(1000);
        checkCaptchaFinish();
        return;
    }
    let frame = theFrame();
    await sleep(500);
    frame.document.getElementById("nextTicketSelection").click();
    return;
}

async function reload() {
    let frame = theFrame();
    frame.document.getElementById("btnReloadSchedule").click();
    await sleep(750);
}

async function searchSeat(data) {
    for (sec of data.section) {
        openEverySection();
        await clickOnArea(sec);
        if (await findSeat()) {
            checkCaptchaFinish();
            return;
        }
    }
    reload();
    await searchSeat(data);
}

async function waitFirstLoadA() {
    let concertId = getConcertId();
    let data = await get_stored_value(concertId);
    await sleep(1000);
    searchSeat(data);
}

async function waitFirstLoad() {
    let concertId = getConcertId();
    let data = await get_stored_value(concertId);
    await sleep(1000);
    searchSeat(data);

    // ➕ 啟動定時通知
    startKeepAlive();
}


waitFirstLoad();